import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API - loaded from .env via dotenv/config
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: { "User-Agent": "aistudio-build" },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  // ── In-memory database ─────────────────────────────────────────────────────
  const db: {
    users: any[];
    courses: any[];
    enrollments: Record<number, number[]>;      // userId -> courseId[]
    lessonProgress: Record<string, number[]>;   // "userId-courseId" -> completedLessonIds[]
  } = {
    users: [
      { id: 1, name: "Student User", role: "student", progress: 65, streak: 12 },
      { id: 2, name: "Instructor User", role: "instructor", courses: 5 },
      { id: 3, name: "Admin User", role: "admin" },
    ],
    courses: [
      {
        id: 101,
        title: "Generative AI Foundations",
        category: "AI",
        difficulty: "Beginner",
        rating: 4.9,
        duration: "4 weeks",
        description: "Understand large language models (LLMs), master prompt engineering, and build intelligent AI-powered agents.",
        instructor: "Dr. Maria Patel",
        thumbnail: "✨",
        lessons: [
          { id: 1, title: "What is Generative AI?", duration: "15 min", type: "reading" },
          {
            id: 2,
            title: "How Large Language Models Work",
            duration: "25 min",
            type: "video",
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41857-large.mp4",
            transcript: [
              { time: 0, text: "Welcome back! Today we are diving into Large Language Models, or LLMs." },
              { time: 3, text: "These models are powered by the Transformer architecture, introduced in 2017." },
              { time: 6, text: "At their core, they predict the next most likely word in a sequence based on context." },
              { time: 9, text: "By training on billions of web pages, they learn grammar, facts, and reasoning skills." },
              { time: 12, text: "Let's explore how self-attention weights prioritize different words in a prompt." }
            ],
            keyMoments: [
              { time: 0, title: "Introduction to LLMs", description: "Overview of what LLMs are and their role in modern AI." },
              { time: 3, title: "The Transformer Engine", description: "Understanding the underlying 2017 transformer neural network architecture." },
              { time: 6, title: "Autoregressive Next-Token Prediction", description: "How models predict subsequent text probabilistically." },
              { time: 9, title: "Training at Scale", description: "Grasping the massive computing power and dataset scale required." }
            ],
            inVideoQuizzes: [
              {
                time: 6,
                question: "What is the core training objective of a standard autoregressive Large Language Model?",
                options: [
                  "To translate sentences into multiple languages simultaneously",
                  "To predict the next most probable word or token in a sequence",
                  "To classify images into structured semantic folders",
                  "To detect SQL injections and clean database queries"
                ],
                correctAnswer: 1,
                explanation: "Autoregressive LLMs are trained strictly to predict the next word or token in a sequence given the preceding context."
              }
            ]
          },
          { id: 3, title: "Prompt Engineering Fundamentals", duration: "30 min", type: "lab" },
          { id: 4, title: "Working with the Gemini API", duration: "35 min", type: "lab" },
          { id: 5, title: "Building a Chatbot Application", duration: "40 min", type: "project" },
          { id: 6, title: "AI Safety, Ethics & Responsible Use", duration: "20 min", type: "reading" }
        ]
      },
      {
        id: 102,
        title: "Deep Learning & Neural Networks",
        category: "AI",
        difficulty: "Medium",
        rating: 4.8,
        duration: "8 weeks",
        description: "Master the foundations of neural network architectures, backpropagation, and deep modeling.",
        instructor: "Dr. Sarah Chen",
        thumbnail: "🧠",
        lessons: [
          { id: 1, title: "Introduction to Artificial Neural Networks", duration: "20 min", type: "reading" },
          {
            id: 2,
            title: "Backpropagation & Gradient Descent",
            duration: "40 min",
            type: "video",
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-glowing-neon-lines-moving-in-a-loop-41856-large.mp4",
            transcript: [
              { time: 0, text: "Hello everyone! Today we will demystify backpropagation, the heart of deep learning." },
              { time: 3, text: "It is the mathematical engine that computes the gradients of our cost function." },
              { time: 6, text: "Using the Chain Rule from calculus, we propagate errors backward through each layer." },
              { time: 9, text: "We then apply Gradient Descent to adjust weights and minimize the network loss." },
              { time: 12, text: "Let's work out the mathematical partial derivatives on the board." }
            ],
            keyMoments: [
              { time: 0, title: "Welcome to Backprop", description: "High-level goal of calculating cost gradients." },
              { time: 3, title: "The Calculus Chain Rule", description: "Applying partial derivatives to backpropagate error signals." },
              { time: 9, title: "Updating Network Weights", description: "How gradient descent steps adjust weight parameters." }
            ],
            inVideoQuizzes: [
              {
                time: 5,
                question: "Which mathematical rule serves as the foundation for backpropagation?",
                options: [
                  "L'Hopital's Rule",
                  "The Chain Rule of Calculus",
                  "The Central Limit Theorem",
                  "Bayes' Theorem"
                ],
                correctAnswer: 1,
                explanation: "Backpropagation relies heavily on the calculus Chain Rule to compute partial derivatives of loss with respect to weights across deep layers."
              }
            ]
          },
          { id: 3, title: "Building a Multi-Layer Perceptron in Python", duration: "45 min", type: "lab" },
          {
            id: 4,
            title: "CNNs for Computer Vision",
            duration: "50 min",
            type: "video",
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-virtual-reality-headset-on-a-neon-lighted-table-41865-large.mp4",
            transcript: [
              { time: 0, text: "Let's explore Convolutional Neural Networks, or CNNs, engineered for visual data." },
              { time: 3, text: "Unlike MLPs, CNNs leverage shared weights to preserve spatial hierarchy in images." },
              { time: 6, text: "Convolution operations apply local filters to capture edge and shape features." },
              { time: 9, text: "Pooling layers then downsample spatial dimensions to achieve translation invariance." }
            ],
            keyMoments: [
              { time: 0, title: "Spatial Invariance", description: "Why standard MLPs fail on complex images compared to CNNs." },
              { time: 6, title: "Convolution Filters", description: "How local kernels detect features like edges, textures, and shapes." }
            ],
            inVideoQuizzes: [
              {
                time: 5,
                question: "What is the primary role of a Pooling layer in a CNN?",
                options: [
                  "To add non-linear activations to inputs",
                  "To downsample spatial dimensions and reduce computation",
                  "To backpropagate classification errors directly",
                  "To normalize learning rates automatically"
                ],
                correctAnswer: 1,
                explanation: "Pooling layers downsample the width and height of feature maps, reducing parameter count and computational complexity while maintaining spatial context."
              }
            ]
          }
        ]
      },
      {
        id: 103,
        title: "Advanced Machine Learning",
        category: "AI",
        difficulty: "Hard",
        rating: 4.7,
        duration: "10 weeks",
        description: "Master regression paradigms, decision tree ensembles, and advanced Reinforcement Learning concepts.",
        instructor: "Prof. James Liu",
        thumbnail: "🤖",
        lessons: [
          { id: 1, title: "Supervised vs Unsupervised Learning Deep Dive", duration: "25 min", type: "reading" },
          {
            id: 2,
            title: "Linear & Logistic Regression Under the Hood",
            duration: "35 min",
            type: "video",
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-working-on-a-futuristic-computer-42023-large.mp4",
            transcript: [
              { time: 0, text: "Let's study Linear and Logistic Regression mathematically today." },
              { time: 3, text: "Linear regression predicts continuous variables by fitting a linear hyperplane." },
              { time: 6, text: "Logistic regression uses the Sigmoid activation to squash outputs between 0 and 1." },
              { time: 9, text: "This yields a probability estimate, perfect for binary classification tasks." }
            ],
            keyMoments: [
              { time: 0, title: "Hypothesis Function", description: "Setting up the mathematical regression equation." },
              { time: 6, title: "The Sigmoid Activation", description: "How the sigmoid mathematical function squashes real numbers into probabilities." }
            ],
            inVideoQuizzes: [
              {
                time: 5,
                question: "What mathematical function is used in Logistic Regression to model binary probabilities?",
                options: [
                  "ReLU function",
                  "Sigmoid (Logistic) function",
                  "Hyperbolic Tangent (tanh)",
                  "Softmax function"
                ],
                correctAnswer: 1,
                explanation: "The Sigmoid activation function squashes the input log-odds into a probability range between 0 and 1."
              }
            ]
          }
        ]
      },
      {
        id: 104,
        title: "Natural Language Processing & AI Agents",
        category: "AI",
        difficulty: "Medium",
        rating: 4.6,
        duration: "8 weeks",
        description: "Build semantic search applications, explore vector embeddings, and construct multi-agent reasoning systems.",
        instructor: "Alex Torres",
        thumbnail: "💬",
        lessons: [
          { id: 1, title: "Introduction to NLP & Text Processing", duration: "20 min", type: "reading" },
          {
            id: 2,
            title: "Word Embeddings & Vector Databases",
            duration: "30 min",
            type: "video",
            videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-binary-code-scrolling-on-a-computer-screen-42024-large.mp4",
            transcript: [
              { time: 0, text: "Welcome! Today we are talking about vector embeddings and high-dimensional semantic space." },
              { time: 3, text: "Embedding algorithms represent words or documents as dense vectors in 1536-dimensional space." },
              { time: 6, text: "Cosine similarity measures the angle between these vectors to determine semantic closeness." },
              { time: 9, text: "Vector databases allow us to perform rapid approximate nearest neighbor search at scale." }
            ],
            keyMoments: [
              { time: 0, title: "Embedding Concepts", description: "Mapping abstract linguistic semantics to real numbers." },
              { time: 6, title: "Similarity Metrics", description: "Understanding cosine distance and dot products for semantic matching." },
              { time: 9, title: "Vector DB Systems", description: "Role of vector indexes like HNSW in real-time query retrievals." }
            ],
            inVideoQuizzes: [
              {
                time: 5,
                question: "Which mathematical metric is most commonly used to measure semantic similarity between vector embeddings?",
                options: [
                  "Euclidean Distance (L2)",
                  "Manhattan Distance (L1)",
                  "Cosine Similarity",
                  "Hamming Distance"
                ],
                correctAnswer: 2,
                explanation: "Cosine similarity calculates the cosine of the angle between two multi-dimensional vectors, measuring directional alignment regardless of magnitude."
              }
            ]
          }
        ]
      }
    ],
    enrollments: { 1: [101, 102] }, // student 1 pre-enrolled in two courses
    lessonProgress: { "1-101": [1], "1-102": [1] }, // some lessons done
  };

  // ── Auth / User ────────────────────────────────────────────────────────────
  app.get("/api/user", (_req, res) => res.json(db.users[0]));

  // ── Dashboard stats ────────────────────────────────────────────────────────
  app.get("/api/dashboard/:role", (req, res) => {
    const role = req.params.role;
    if (role === "student") {
      const enrolled = db.enrollments[1] || [];
      res.json({
        enrolledCourses: enrolled.length,
        completedCourses: 2,
        overallProgress: 65,
        certificates: 1,
        learningStreak: 12,
      });
    } else if (role === "instructor") {
      res.json({ totalStudents: 1240, activeCourses: 5, averageRating: 4.7, totalRevenue: "$12,450" });
    } else if (role === "admin") {
      res.json({ totalUsers: 4521, systemHealth: "100%", activeSubscriptions: 3200, pendingApprovals: 15 });
    } else {
      res.status(400).json({ error: "Invalid role" });
    }
  });

  // ── Courses catalog ────────────────────────────────────────────────────────
  app.get("/api/courses", (_req, res) => {
    const userId = 1;
    const enrolled = db.enrollments[userId] || [];
    const result = db.courses.map((c) => ({
      ...c,
      enrolled: enrolled.includes(c.id),
      lessonCount: c.lessons.length,
    }));
    res.json(result);
  });

  // ── Single course with lessons ─────────────────────────────────────────────
  app.get("/api/courses/:id", (req, res) => {
    const courseId = parseInt(req.params.id);
    const userId = 1;
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const enrolled = (db.enrollments[userId] || []).includes(courseId);
    const completed = db.lessonProgress[`${userId}-${courseId}`] || [];
    res.json({ ...course, enrolled, completedLessons: completed });
  });

  // ── Enroll in a course ─────────────────────────────────────────────────────
  app.post("/api/enroll", (req, res) => {
    const { courseId } = req.body;
    const userId = 1;
    if (!db.enrollments[userId]) db.enrollments[userId] = [];
    if (!db.enrollments[userId].includes(courseId)) {
      db.enrollments[userId].push(courseId);
    }
    res.json({ success: true, enrolled: db.enrollments[userId] });
  });

  // ── Mark lesson complete ───────────────────────────────────────────────────
  app.post("/api/progress", (req, res) => {
    const { courseId, lessonId } = req.body;
    const userId = 1;
    const key = `${userId}-${courseId}`;
    if (!db.lessonProgress[key]) db.lessonProgress[key] = [];
    if (!db.lessonProgress[key].includes(lessonId)) {
      db.lessonProgress[key].push(lessonId);
    }
    res.json({ success: true, completed: db.lessonProgress[key] });
  });

  // ── AI: Course Recommendations ─────────────────────────────────────────────
  app.post("/api/ai/recommend", async (req, res) => {
    try {
      const { userInterests, currentSkills, goal } = req.body;
      const prompt = `You are an expert EdTech curriculum designer. Based on this student profile, recommend 4 highly personalized courses:
Interests: ${userInterests?.join(", ")}
Current Skills: ${currentSkills?.join(", ")}
Goal: ${goal}

Use your knowledge and search for the most relevant, up-to-date courses (real or synthesized).
Respond ONLY with a JSON array:
[{"title":"Course Title","reason":"Why it fits this student's goal specifically","difficulty":"Beginner|Medium|Hard","duration":"X weeks","category":"AI|Web|Programming|Design|Data"}]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
        },
      });
      const data = response.text ? JSON.parse(response.text) : [];
      res.json({ recommendations: data });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate recommendations" });
    }
  });

  // ── AI: Tutor Chatbot ──────────────────────────────────────────────────────
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const contents = history
        ? [...history, { role: "user", parts: [{ text: message }] }]
        : [{ role: "user", parts: [{ text: message }] }];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents,
        config: {
          systemInstruction:
            "You are 'SphereBot', an expert AI tutor for the LearnSphere E-Learning platform. Help users deeply understand any subject. Always use the Google Search tool to look up official documentation (MDN, Python docs, Wikipedia), real examples, and tutorials. Include clickable markdown hyperlinks to quality resources. Structure your answers with clear headings, code blocks where relevant, and step-by-step explanations. Be encouraging, precise, and thorough.",
          tools: [{ googleSearch: {} }],
        },
      });
      res.json({ response: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate chat response" });
    }
  });

  // ── AI: Smart Quiz (5 Qs with explanations) ───────────────────────────────
  app.post("/api/ai/quiz", async (req, res) => {
    try {
      const { topic, difficulty, numQuestions = 5 } = req.body;
      const prompt = `Generate ${numQuestions} high-quality multiple-choice quiz questions about "${topic}" at "${difficulty}" difficulty level.
Use web search to ensure factual accuracy and use real-world scenarios, edge cases, and practical applications.
Avoid trivial recall questions — test genuine understanding and problem-solving ability.
Return ONLY a JSON array:
[{
  "id": 1,
  "question": "Scenario-based or conceptual question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Clear explanation of why the correct answer is right, and why others are wrong.",
  "concept": "Key concept being tested"
}]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
        },
      });
      const quizData = response.text ? JSON.parse(response.text) : [];
      res.json({ questions: quizData });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate quiz" });
    }
  });

  // ── AI: Lesson Summary ─────────────────────────────────────────────────────
  app.post("/api/ai/lesson-summary", async (req, res) => {
    try {
      const { lessonTitle, courseName } = req.body;
      const prompt = `You are an expert educator. Write a concise, engaging, and informative lesson summary for the topic: "${lessonTitle}" from the course "${courseName}".

Include:
1. **Overview** - What this lesson covers and why it matters (2-3 sentences)
2. **Key Concepts** - 3-5 bullet points of the most important things to understand
3. **Real-World Application** - One practical example of how this is used in the real world
4. **Quick Tip** - One pro tip or common mistake to avoid

Use markdown formatting. Search the web to ensure accuracy and currency.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      res.json({ summary: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate lesson summary" });
    }
  });

  // ── AI: Study Plan Generator ───────────────────────────────────────────────
  app.post("/api/ai/study-plan", async (req, res) => {
    try {
      const { courseTitle, availableHoursPerWeek, currentLevel } = req.body;
      const prompt = `Create a personalized weekly study plan for a student taking "${courseTitle}".
Student profile: ${currentLevel} level, available ${availableHoursPerWeek} hours/week.

Generate a practical, motivating 4-week study plan with:
- Daily/weekly goals
- Specific topics to cover each week
- Practice exercises and projects
- Milestones to measure progress

Format as markdown with clear weekly sections, checklists, and actionable tasks.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      res.json({ plan: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate study plan" });
    }
  });

  // ── AI: Concept Explainer ──────────────────────────────────────────────────
  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { concept, context } = req.body;
      const prompt = `Explain "${concept}" ${context ? `in the context of ${context}` : ""} in a clear, beginner-friendly way.
Use an analogy, a real-world example, and include a simple code snippet if applicable.
Search for the most accurate and up-to-date information. Include links to helpful resources.
Keep it concise but thorough — max 300 words.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      res.json({ explanation: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to explain concept" });
    }
  });

  // ── AI: Syllabus Generator ────────────────────────────────────────────────
  app.post("/api/ai/generate-syllabus", async (req, res) => {
    try {
      const { topic, difficulty, duration } = req.body;
      const prompt = `You are a world-class EdTech Curriculum Architect. 
      Generate a beautiful, complete, structured course syllabus for a course titled "${topic}".
      Difficulty Level: ${difficulty}
      Target Duration: ${duration}
      
      Generate exactly 4 comprehensive lessons. For each lesson, provide:
      1. Lesson Title
      2. Delivery Format (e.g. Video, Lab, Reading, Project)
      3. Focus & Key Takeaway
      4. Brief Video Script outline (1 sentence)
      
      Format your response in beautiful, clean markdown with headings, bold text, and bullet points.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-05-20",
        contents: prompt,
      });
      res.json({ syllabus: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate syllabus" });
    }
  });

  // ── Vite dev / static prod ─────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ LearnSphere server running on http://localhost:${PORT}`);
    console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? "Loaded ✓" : "MISSING — add to .env"}`);
  });
}

startServer();
