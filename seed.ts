
import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, Timestamp } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKNSbt5df1kuI7tfECMDl5QEdVAUEqT6s",
  authDomain: "verdantflow-8lsqk.firebaseapp.com",
  projectId: "verdantflow-8lsqk",
  storageBucket: "verdantflow-8lsqk.appspot.com",
  messagingSenderId: "56107029688",
  appId: "1:56107029688:web:3c20cc2787fe61db7f504d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedDatabase = async () => {
  const batch = writeBatch(db);

  // 1. Employees
  const employees = [
    { id: "emp-1", name: "Alice Johnson", email: "alice@example.com", avatar: "https://placehold.co/64x64/34D399/065F46.png" },
    { id: "emp-2", name: "Bob Williams", email: "bob@example.com", avatar: "https://placehold.co/64x64/FBBF24/78350F.png" },
    { id: "emp-3", name: "Charlie Brown", email: "charlie@example.com", avatar: "https://placehold.co/64x64/F87171/7F1D1D.png" },
  ];
  employees.forEach(emp => {
    const docRef = doc(db, "employees", emp.id);
    batch.set(docRef, emp);
  });
  console.log("Prepared employees for batch.");

  // 2. Tasks
  const tasks = [
    {
      id: "task-1",
      title: "Develop User Authentication",
      description: "Implement email/password and social login.",
      status: "In Progress",
      priority: "High",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 1 week from now
      assigneeId: "emp-1",
      dependsOn: [],
    },
    {
      id: "task-2",
      title: "Design Dashboard UI",
      description: "Create mockups and a component library.",
      status: "To Do",
      priority: "Medium",
      dueDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)), // 2 weeks from now
      assigneeId: "emp-2",
      dependsOn: [],
    },
    {
        id: "task-3",
        title: "Setup CI/CD Pipeline",
        description: "Configure automated testing and deployment.",
        status: "Blocked",
        priority: "High",
        dueDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
        assigneeId: "emp-1",
        dependsOn: ["task-1"],
    },
     {
        id: "task-4",
        title: "Write API Documentation",
        description: "Document all endpoints for the new API.",
        status: "Done",
        priority: "Low",
        dueDate: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
        assigneeId: "emp-3",
        dependsOn: [],
    }
  ];

  tasks.forEach(task => {
    const { id, ...taskData } = task;
    const docRef = doc(db, "tasks", id);
    batch.set(docRef, taskData);
  });
  console.log("Prepared tasks for batch.");
  
  // 3. Sub-tasks for task-1
  const subTasks = [
      { parentId: "task-1", text: "Implement password reset flow", completed: false },
      { parentId: "task-1", text: "Add Google Sign-In", completed: true },
  ];

  subTasks.forEach(sub => {
      const { parentId, ...subData } = sub;
      const subTaskRef = doc(collection(db, "tasks", parentId, "subTasks"));
      batch.set(subTaskRef, subData);
  })
  console.log("Prepared sub-tasks for batch.");

  // 4. Comments for task-2
  const comments = [
      { parentId: "task-2", authorId: "emp-1", text: "What color palette should we use?", timestamp: Timestamp.now(), attachments: [] }
  ];

  comments.forEach(com => {
      const { parentId, ...comData } = com;
      const commentRef = doc(collection(db, "tasks", parentId, "comments"));
      batch.set(commentRef, comData);
  })
  console.log("Prepared comments for batch.");

  // Commit the batch
  try {
    await batch.commit();
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database: ", error);
  }
};

seedDatabase().then(() => {
    console.log("Seeding process finished.");
    // In a real script, you might want to exit the process
    // process.exit(0);
});
