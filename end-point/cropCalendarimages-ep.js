const multer = require('multer');
const imageupDao = require("../dao/cropCalendarimages-dao");
const asyncHandler = require("express-async-handler");

const storage = multer.memoryStorage();
exports.upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
        }
        cb(null, true);
    },
});

exports.uploadImage = asyncHandler(async(req, res) => {
    try {
        console.log('Received FormData:', req.body);
        console.log('Received file details:', req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const { slaveId } = req.body;
        if (!slaveId) {
            return res.status(400).json({ message: 'No slaveId provided.' });
        }

        const image = req.file.buffer;

        const result = await imageupDao.insertTaskImage(slaveId, image);

        console.log('Image uploaded successfully:', result); 
        res.status(200).json({
            message: 'Image uploaded successfully.',
            imageDetails: {
                mimeType: req.file.mimetype,
                size: req.file.size,
            },
            result: result, 
        });
    } catch (error) {
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File size exceeds the maximum allowed size of 10 MB.',
            });
        }

        console.error('Error during image upload:', error); 
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

exports.getRequiredImagesEndpoint = asyncHandler(async(req, res) => {
    try {
        const { cropId } = req.params;

        console.log(cropId);

        if (!cropId) {
            return res.status(400).json({ message: 'No cropId provided.' });
        }

        // Fetch the number of required images for the given cropId
        const requiredImages = await imageupDao.getRequiredImages(cropId);

        if (requiredImages === null) {
            return res.status(404).json({ message: 'No data found for the provided cropId.' });
        }

        res.status(200).json({
            message: 'Required images fetched successfully.',
            requiredImages: requiredImages,
        });
    } catch (error) {
        console.error('Error fetching required images:', error); // Log detailed error
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}); 


