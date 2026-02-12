import GeneralPermission from "../models/GeneralPermission.js";

// GET latest general permission
export const getLatestGeneralPermission = async (req, res) => {
  try {
    const gp = await GeneralPermission.findOne();
    if (!gp || !gp.enabled) {
      return res.json({ enabled: false });
    }
    res.json(gp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ENABLE / UPDATE GP
export const enableGeneralPermission = async (req, res) => {
  try {
    const { startDate, endDate, startTime, endTime } = req.body;
    if (!startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({ message: "All GP fields required" });
    }

    let gp = await GeneralPermission.findOne();

    if (!gp) {
      gp = new GeneralPermission({ enabled: true, startDate, endDate, startTime, endTime });
    } else {
      gp.enabled = true;
      gp.startDate = startDate;
      gp.endDate = endDate;
      gp.startTime = startTime;
      gp.endTime = endTime;
    }

    await gp.save();
    res.json({ message: "General Permission Enabled", gp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
