const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('../utils/Cloudinary'); // Adjust the path as necessary
const storage = multer.memoryStorage();
const upload = multer({ storage });
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust the path as necessary
const JobModel = require('../models/Jobs'); // Adjust the path as necessary
const pdfParse = require('pdf-parse');

router.post('/register', upload.single('profilePic'), async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    const findUser = await User.findOne({ email });
    if (findUser) {
        return res.status(400).json({ message: 'User already exists' });
    }
    let profilePicture = ''

    if (req.file) {
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { resource_type: 'image' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        profilePicture = result.secure_url;
    }
    const newUser = new User({
        name,
        email,
        password,
        profilePic: profilePicture
    });
    newUser.save()
        .then(user => {
            res.status(201).json({ message: 'User created successfully', user });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const user = await User.find({ email, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password first register' });
        }
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// --------------------------CREATE JOB----------------------------
// This route allows users to create a job posting with an optional company picture.
router.post('/createjob', upload.single('companyPic'), async (req, res) => {
    const { creatorId, companyName, jobTitle, jobDescription, money, location, experienceLevel } = req.body;

    if (!creatorId || !companyName || !jobTitle || !jobDescription || !money || !location || !experienceLevel) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    let companyPicture = '';

    if (req.file) {
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { resource_type: 'image' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        companyPicture = result.secure_url;
    }
    if (!mongoose.Types.ObjectId.isValid(creatorId)) {
        return res.status(400).json({ message: 'Invalid creator ID' });
    }
    const newJob = new JobModel({
        creatorId,
        companyName,
        jobTitle,
        jobDescription,
        money,
        companyPic: companyPicture,
        location,
        experienceLevel,

    });

    newJob.save()
        .then(job => {
            res.status(201).json({ message: 'Job created successfully', job });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        });
});


// --------------------------GET ALL JOBS----------------------------
// This route retrieves all job postings from the database.
router.get('/getalljobs', async (req, res) => {
    try {
        const jobs = await JobModel.find().populate('creatorId', 'name profilePic');
        res.status(200).json({ message: 'Jobs retrieved successfully', jobs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// --------------------------GET JOB BY ID----------------------------
// This route retrieves a specific job posting by its ID.
router.get('/getjob/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }

    try {
        const job = await JobModel.findById(id).populate('creatorId', 'name profilePic');
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json({ message: 'Job retrieved successfully', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --------------------------APPLLication Fill Up----------------------------
router.patch('/applyjob/:id', upload.single('pdf'), async (req, res) => {
    const { id } = req.params;// Extract the job ID from the request parameters
    const { userId } = req.body;// Extract the user ID from the request body
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }
    try {
        const job = await
            JobModel.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        // Prevent duplicate applications
        const alreadyApplied = job.applicationFillUp.some(app => app.userId.toString() === userId);
        if (alreadyApplied) {
            return res.status(400).json({ message: 'User already applied to this job' });
        }

        // Sanity check: make sure file exists and is a PDF
        const file = req.file;
        if (!file || file.mimetype !== 'application/pdf') {
            return res.status(400).json({ message: 'Please upload a valid PDF file' });
        }
        const uploaded = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    public_id: `resume_${userId}_${Date.now()}.pdf`,
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(error);
                    }

                    let url = result.secure_url;

                    // Inject fl_inline to open in browser directly
                    url = url.replace('/upload/', '/upload/fl_inline/');

                    resolve(url);
                }
            );

            // Start streaming the file
            stream.end(file.buffer);
        });


        const application = {
            userId,
            pdf: uploaded
        };

        job.applicationFillUp.push(application);
        await job.save();

        res.status(200).json({ message: 'Application submitted successfully', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// this portion is done---------------------------------------------------------------->>>>>>>>>>>>

//---------------------------SAVED JOBS---------------------------->>>>>>>>
router.patch('/savejob/:id', async (req, res) => {
    const { id } = req.params;// Extract the job ID from the request parameters
    const { userId } = req.body;// Extract the user ID from the request body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const job = await JobModel.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent duplicate saves
        if (user.savedPosts.includes(id)) {
            return res.status(400).json({ message: 'Job already saved' });
        }

        user.savedPosts.push(id);
        await user.save();

        res.status(200).json({ message: 'Job saved successfully', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//---------------------------Applied JOBS---------------------------->>>>>>>>
router.patch('/appliedjobs/:id', async (req, res) => {
    const { id } = req.params;// Extract the job ID from the request parameters
    const { userId } = req.body;// Extract the user ID from the request body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const job = await JobModel.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent duplicate applications
        if (user.AppliedJobs.includes(id)) {
            return res.status(400).json({ message: 'Job already applied' });
        }

        user.AppliedJobs.push(id);
        await user.save();

        res.status(200).json({ message: 'Job application submitted successfully', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//--------------------------- MY APPLIED JOBS---------------------------->>>>>
router.get('/myappliedjobs/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(userId).populate('AppliedJobs');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.AppliedJobs.length === 0) {
            return res.status(404).json({ message: 'No applied jobs found for this user' });
        }
        res.status(200).json({ message: 'Applied jobs retrieved successfully', appliedJobs: user.AppliedJobs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//--------------------------- MY SAVED JOBS---------------------------->>>>>
router.get('/mysavedjobs/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(userId).populate('savedPosts');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.savedPosts.length === 0) {
            return res.status(404).json({ message: 'No saved jobs found for this user' });
        }
        res.status(200).json({ message: 'Saved jobs retrieved successfully', savedJobs: user.savedPosts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});




router.patch('/savejob/:id', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    console.log("Saving job with ID:", id, "for user ID:", userId);


    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const job = await JobModel.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.savedPosts.includes(id)) {
            user.savedPosts.push(id);
            await user.save();
        }

        return res.status(200).json({ message: 'Job saved successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/savejob/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid ID(s)' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.savedPosts = user.savedPosts.filter(savedId => savedId.toString() !== id);
    await user.save();

    return res.status(200).json({ message: 'Job unsaved successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});






//--------------------------- MY CREATED JOBS---------------------------->>>
router.get('/mycreatedjobs/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        const jobs = await JobModel.find({ creatorId: userId }).populate('creatorId', 'name profilePic');

        res.status(200).json({
            message: jobs.length === 0 ? 'No jobs found for this user' : 'Jobs retrieved successfully',
            jobs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


//--------------------------- DELETE JOB----------------------------
router.delete('/deletejob/:id', async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }

    try {
        const job = await JobModel.findByIdAndDelete(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json({ message: 'Job deleted successfully', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//--------------------------- UPDATE JOB----------------------------
router.put('/updatejob/:id', upload.single('companyPic'), async (req, res) => {
    const { id } = req.params;
    const { companyName, jobTitle, jobDescription, money } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }
    if (!companyName || !jobTitle || !jobDescription || !money) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const job = await JobModel.findById(id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        job.companyName = companyName;
        job.jobTitle = jobTitle;
        job.jobDescription = jobDescription;
        job.money = money;
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });
            job.companyPic = result.secure_url;
        }
        await job.save();
        res.status(200).json({ message: 'Job updated successfully', job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//--------------------------- GET ALL APPLIED USER & PDF----------------------------
router.get('/appliedusers/:jobId', async (req, res) => {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
        return res.status(400).json({ message: 'Invalid job ID' });
    }
    try {
        const job = await JobModel.findById(jobId)
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        const result = job.applicationFillUp.map(app => ({
            userId: app.userId,
            pdfs: app.pdfs
        }));
        if (result.length === 0) {
            return res.status(404).json({ message: 'No applications found for this job' });
        }
        res.status(200).json({ message: 'Applied users retrieved successfully', appliedUsers: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

//--------------------------- ATS SCORE CHECK---------------------------->>>

router.post('/ats-score', upload.single('pdf'), async (req, res) => {
    const { jobDescription } = req.body;
    const file = req.file;

    if (!jobDescription || !file || file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Job description and valid PDF are required' });
    }

    try {
        const resumeText = await pdfParse(file.buffer).then(data => data.text);

        const resumeWords = new Set(resumeText.toLowerCase().split(/\s+/));
        const jobWords = jobDescription.toLowerCase().split(/\s+/);

        let matched = 0;
        jobWords.forEach(word => {
            if (resumeWords.has(word)) matched++;
        });

        const score = (matched / jobWords.length) * 100;

        const suggestions = score < 50
            ? 'Add more job-specific keywords to improve your match.'
            : 'Great match!';

        res.status(200).json({
            score: score.toFixed(2),
            suggestions
        });

    } catch (err) {
        console.error("ATS scoring error:", err);
        res.status(500).json({ message: 'Failed to process resume.' });
    }
});



module.exports = router;