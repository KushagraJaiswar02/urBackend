const Project = require('../models/Project');
const { hashApiKey } = require('../utils/api');
const {
    setProjectByApiKeyCache,
    getProjectByApiKeyCache
} = require("../services/redisCaching");

module.exports = async (req, res, next) => {
    try {
        console.time("api chk middleware")
        const apiKey = req.header('x-api-key');
        if (!apiKey) {
            return res.status(401).json({ error: 'API key not found' });
        }

        const hashedApi = hashApiKey(apiKey);

        console.time("get project by api key cache")
        let project = await getProjectByApiKeyCache(hashedApi);
        console.timeEnd("get project by api key cache")

        if (!project) {
            console.time("get project by api key from db")
            project = await Project.findOne({ apiKey: hashedApi })
                .select(`
                    owner
                    jwtSecret
                    resources
                    collections
                    databaseLimit
                    databaseUsed
                    storageLimit
                    storageUsed
                `)
                .populate('owner', 'isVerified')
                .lean();
            console.timeEnd("get project by api key from db")

            if (!project) {
                return res.status(401).json({
                    error: "API key is expired or invalid.",
                    action: "Please use a valid API key or regenerate a new one from the dashboard."
                });
            }

            await setProjectByApiKeyCache(hashedApi, project);
        }

        if (!project.owner.isVerified) {
            return res.status(401).json({
                error: 'Owner not verified',
                fix: 'Verify your account on https://urbackend.bitbros.in/dashboard'
            });
        }

        // Ensure defaults are present (crucial for lean objects or cached POJOs)
        if (!project.resources) project.resources = {};
        if (!project.resources.db) project.resources.db = { isExternal: false };
        if (!project.resources.storage) project.resources.storage = { isExternal: false };

        req.project = project;
        req.hashedApiKey = hashedApi;
        console.timeEnd("api chk middleware")
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
