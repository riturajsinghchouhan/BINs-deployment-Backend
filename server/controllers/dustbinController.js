import Dustbin from '../models/Dustbin.js';
import User from '../models/User.js';

// @desc    Get all dustbins
// @route   GET /api/dustbins
// @access  Private
const getDustbins = async (req, res) => {
    try {
        const dustbins = await Dustbin.find();
        res.status(200).json(dustbins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single dustbin
// @route   GET /api/dustbins/:id
// @access  Private
const getDustbin = async (req, res) => {
    try {
        const dustbin = await Dustbin.findById(req.params.id);
        if (!dustbin) {
            return res.status(404).json({ message: 'Dustbin not found' });
        }
        res.status(200).json(dustbin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new dustbin
// @route   POST /api/dustbins
// @access  Private/Admin
const createDustbin = async (req, res) => {
    const { binNumber, location, latitude, longitude } = req.body;

    if (!binNumber || !location || !latitude || !longitude) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    try {
        const dustbin = await Dustbin.create({
            binNumber,
            location,
            latitude,
            longitude,
            longitude,
            status: req.body.status || 'empty',
            fillLevel: req.body.fillLevel || 0
        });
        res.status(201).json(dustbin);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update dustbin
// @route   PUT /api/dustbins/:id
// @access  Private (Worker/Admin)
const updateDustbin = async (req, res) => {
    try {
        const dustbin = await Dustbin.findById(req.params.id);

        if (!dustbin) {
            return res.status(404).json({ message: 'Dustbin not found' });
        }

        const updatedDustbin = await Dustbin.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json(updatedDustbin);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete dustbin
// @route   DELETE /api/dustbins/:id
// @access  Private/Admin
const deleteDustbin = async (req, res) => {
    try {
        const dustbin = await Dustbin.findById(req.params.id);

        if (!dustbin) {
            return res.status(404).json({ message: 'Dustbin not found' });
        }

        await dustbin.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update bin from ESP32
// @route   POST /api/dustbins/update-bin
// @access  Public
const updateBinFromDevice = async (req, res) => {
    const { binNumber, fillLevel } = req.body;

    try {
        const dustbin = await Dustbin.findOne({ binNumber });

        if (!dustbin) {
            return res.status(404).json({ message: "Bin not found" });
        }

        dustbin.fillLevel = fillLevel;

        // auto status
        if (fillLevel <= 20) dustbin.status = "empty";
        else if (fillLevel <= 50) dustbin.status = "half";
        else if (fillLevel <= 80) dustbin.status = "almost full";
        else dustbin.status = "full";

        await dustbin.save();

        res.status(200).json({ message: "Updated successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getDustbins,
    getDustbin,
    createDustbin,
    updateDustbin,
    deleteDustbin,
    updateBinFromDevice
};
