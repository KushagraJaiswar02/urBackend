const modelRegistry = new WeakMap();
const mongoose = require("mongoose");

const typeMapping = {
    String: String,
    Number: Number,
    Boolean: Boolean,
    Date: Date
};

function buildMongooseSchema(fieldsArray) {
    const schemaDef = {};

    fieldsArray.forEach(field => {
        schemaDef[field.key] = {
            type: typeMapping[field.type],
            required: !!field.required
        };
    });

    return new mongoose.Schema(schemaDef, { timestamps: true, strict: false, minimize: false });
}


function getCompiledModel(connection, collectionData, projectId, isExternal) {

    let collectionName = "";

    if (!isExternal) {
        collectionName = `${projectId}_${collectionData.name}`
    } else {
        collectionName = collectionData.name;

    }


    // Get per-connection cache
    if (!modelRegistry.has(connection)) {
        modelRegistry.set(connection, new Map());
    }

    const connectionModels = modelRegistry.get(connection);

    // If already compiled for THIS connection
    if (connectionModels.has(collectionName)) {
        return connectionModels.get(collectionName);
    }

    // If model already exists on connection (edge case)
    if (connection.models[collectionName]) {
        const existingModel = connection.models[collectionName];
        connectionModels.set(collectionName, existingModel);
        return existingModel;
    }

    // Build schema + compile
    const schema = buildMongooseSchema(collectionData.model);
    const model = connection.model(collectionName, schema);

    // Cache it
    connectionModels.set(collectionName, model);

    return model;
}

module.exports = { getCompiledModel };