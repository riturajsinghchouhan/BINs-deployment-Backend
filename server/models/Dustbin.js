import mongoose from 'mongoose';

const dustbinSchema = new mongoose.Schema({
    binNumber: {
        type: String,
        required: [true, 'Please add a Bin Number'],
        unique: true
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    latitude: {
        type: Number,
        required: [true, 'Please add latitude']
    },
    longitude: {
        type: Number,
        required: [true, 'Please add longitude']
    },
    status: {
        type: String,
        enum: ['empty', 'half-full', 'full', 'being-emptied'],
        default: 'empty'
    },
    fillLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    lastEmptied: {
        type: Date
    },
    assignedWorkerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Dustbin = mongoose.model('Dustbin', dustbinSchema);
export default Dustbin;
