const Billing = require("../models/billing");
const { createResponse } = require("../utils/response");
const Notification = require("../models/notification");
const User = require("../models/user");
// const xlsx = require('xlsx');

// GET /api/billings
const getAllBillings = async (req, res) => {
    const { _id } = req.user
    try {
        const user = await User.findById(_id);
        let queryObj = { ...req.query, userId: user.id };
        if (req.query.pickedStatus) {
            queryObj["picker.status"] = req.query.pickedStatus;
            delete queryObj.pickedStatus;
        }
        if (req.query.packedStatus) {
            queryObj["packer.status"] = req.query.packedStatus;
            delete queryObj.packedStatus;
        }
        if (req.query.verifierStatus) {
            queryObj["verifier.status"] = req.query.verifierStatus;
            delete queryObj.verifierStatus;
        }
        if (req.query.dispatchedStatus) {
            queryObj["dispatch.status"] = req.query.dispatchedStatus;
            delete queryObj.dispatchedStatus;
        }
        if (req.query.startDate) {
            queryObj.createdAt = { $gte: req.query.startDate };
            delete queryObj.startDate;
        }
        if (req.query.endDate) {
            queryObj.createdAt = { $lte: req.query.endDate };
            delete queryObj.endDate;
        }
        console.log(queryObj);
        const billings = await Billing.find(queryObj)
            .sort({ updatedAt: -1 })
            .populate("billItems")
            .lean();
        createResponse(res, 200, "All bills fetched successfully", billings);
    } catch (error) {
        console.log(error);
        createResponse(res, 500, "Server error");
    }
};

// POST /api/billings
const createBilling = async (req, res) => {
    try {
        const bill = await Billing.findOne({ billNumber: req.body.billNumber });
        if (bill) {
            createResponse(res, 400, "Bill number already exists");
            return;
        }
        const newBilling = await Billing.create(req.body);
        await newBilling.save();

        createResponse(res, 201, "Bill created successfully", newBilling);
    } catch (error) {
        console.log(error);
        createResponse(res, 500, "Server error");
    }
};

// GET /api/billings/:id
const getBillingById = async (req, res) => {
    const { id } = req.params;

    try {
        const billing = await Billing.findById(id)
            .populate(["billItems"])
            .lean();

        if (!billing) {
            createResponse(res, 404, "Bill not found");
            return;
        }

        createResponse(res, 200, "Bill fetched successfully", billing);
    } catch (error) {
        console.log(error);
        createResponse(res, 500, "Server error");
    }
};

// PUT /api/billings/:id
const updateBilling = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.body.billNumber) {
            const billing = await Billing.findOne({
                billNumber: req.body.billNumber,
            });
            if (billing) {
                createResponse(res, 400, "Bill number already exists");
                return;
            }
        }

        const billing = await Billing.findByIdAndUpdate(id, req.body, {
            new: true,
        });

        if (!billing) {
            createResponse(res, 404, "Bill not found");
            return;
        }

        createResponse(res, 200, "Bill updated successfully", billing);
    } catch (error) {
        console.log(error);
        createResponse(res, 500, "Server error");
    }
};

// DELETE /api/billings/:id
const deleteBilling = async (req, res) => {
    const { id } = req.params;

    try {
        const billing = await Billing.findByIdAndDelete(id);

        if (!billing) {
            createResponse(res, 404, "Bill not found");
            return;
        }
        createResponse(res, 200, "Bill deleted successfully");

    } catch (error) {
        console.log(error);
        createResponse(res, 500, "Server error");
    }
};


const assignBillToPicker = async (req, res) => {
    const { id } = req.params;
    const { pickerId } = req.body;
    try {
        const billing = await Billing.findById(id);
        if (!billing) {
            createResponse(res, 404, "Bill not found");
            return;
        }
        console.log(pickerId, " ", billing.picker.pickerAssignee);
        billing.picker.pickerAssignee = pickerId;
        await billing.save();
        const notification = await Notification.create({
            userId: pickerId,
            title: "New Bill Assigned",
            message: `You have been assigned a bill`,
        });
        console.log(billing.picker.pickerAssignee);
        createResponse(res, 200, "Bill assigned to picker successfully", notification);
    } catch (error) {
        console.log(error);
        createResponse(res, 500, "Server error");
    }
};

// GET picker information for a specific billing
// router.get("/billing/:id/picker", 
const getPickerByBilling = async (req, res) => {
    try {
        const billingId = req.params.id;
        const billing = await Billing.findById(billingId).populate("picker.pickerAssignee");
        if (!billing) {
            return res.status(404).json({ message: "Billing not found" });
        }

        if (!billing.picker.assigned) {
            return res.status(404).json({ message: "No picker assigned for this billing" });
        }

        const pickerInfo = {
            pickerAssignee: billing.picker.pickerAssignee,
            status: billing.picker.status,
            reassignStatus: billing.picker.reassignStatus,
            numberOfTrays: billing.picker.numberOfTrays,
            comment: billing.picker.comment,
            acceptanceStatus: billing.picker.acceptanceStatus,
            reassign: billing.picker.reassign,
        };

        res.json(pickerInfo);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getAllBillings,
    createBilling,
    getBillingById,
    updateBilling,
    deleteBilling,
    assignBillToPicker,
    getPickerByBilling
};

