const { getConnection } = require('@urbackend/common');
const { getCompiledModel } = require('@urbackend/common');
const mongoose = require('mongoose');

module.exports = async (req, res, next) => {
    try {
        if (req.keyRole === 'secret') {
            return next();
        }

        const { collectionName, id } = req.params;
        const project = req.project;
        const collectionConfig = project.collections.find(c => c.name === collectionName);

        if (!collectionConfig) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const rls = collectionConfig.rls || {};
        if (!rls.enabled) {
            return res.status(403).json({
                error: 'Write blocked for publishable key',
                message: 'Enable RLS for this collection to allow publishable-key writes.'
            });
        }

        if (rls.requireAuthForWrite && !req.authUser?.userId) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Provide a valid user Bearer token for write operations.'
            });
        }

        if ((rls.mode || 'owner-write-only') !== 'owner-write-only') {
            return res.status(403).json({ error: 'Unsupported RLS mode' });
        }

        const ownerField = rls.ownerField || 'userId';

        if (!req.authUser?.userId) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Provide a valid user Bearer token for write operations.'
            });
        }

        const authUserId = String(req.authUser.userId);
        const method = String(req.method || '').toUpperCase();

        if (method === 'POST') {
            const incomingOwner = req.body?.[ownerField];

            if (ownerField === '_id') {
                return res.status(403).json({
                    error: 'Insert denied',
                    message: "RLS ownerField '_id' is not valid for insert ownership checks."
                });
            }

            if (incomingOwner === undefined || incomingOwner === null || incomingOwner === '') {
                req.body[ownerField] = authUserId;
                return next();
            }

            if (String(incomingOwner) !== authUserId) {
                return res.status(403).json({
                    error: 'RLS owner mismatch',
                    message: `You can only create documents with ${ownerField} equal to your user id.`
                });
            }

            return next();
        }

        if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: 'Invalid ID format.' });
            }

            const connection = await getConnection(project._id);
            const Model = getCompiledModel(connection, collectionConfig, project._id, project.resources.db.isExternal);
            const doc = await Model.findById(id).select(ownerField).lean();

            if (!doc) {
                return res.status(404).json({ error: 'Document not found.' });
            }

            if (ownerField === '_id') {
                if (String(doc._id) !== authUserId) {
                    return res.status(403).json({ error: 'RLS owner mismatch', message: 'You can only modify your own document.' });
                }
            } else {
                if (req.body && Object.prototype.hasOwnProperty.call(req.body, ownerField) && String(req.body[ownerField]) !== String(doc[ownerField])) {
                    return res.status(403).json({ error: 'Owner field immutable', message: `${ownerField} cannot be changed under RLS.` });
                }

                if (doc[ownerField] === undefined || doc[ownerField] === null || String(doc[ownerField]) !== authUserId) {
                    return res.status(403).json({ error: 'RLS owner mismatch', message: 'You can only modify your own document.' });
                }
            }

            return next();
        }

        return next();
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
