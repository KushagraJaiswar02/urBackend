const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const project = await mongoose.connection.db.collection('projects').findOne({ 
        _id: new mongoose.Types.ObjectId('69c8f04a14141ecf64ae359d')
    });
    
    if (project) {
        if (!project.collections.some(c => c.name === 'students')) {
            project.collections.push({ name: 'students', model: [] });
            await mongoose.connection.db.collection('projects').updateOne(
                { _id: project._id },
                { $set: { collections: project.collections } }
            );
            console.log('Created students collection');
        } else {
            console.log('Already exists');
        }
        
        const Redis = require('ioredis');
        const redis = new Redis('redis://localhost:6379');
        await redis.flushall();
        console.log('Redis flush complete.');
    } else {
        console.log('Project not found');
    }
    process.exit();
}).catch(console.error);
