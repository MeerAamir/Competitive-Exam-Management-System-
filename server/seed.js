const { sequelize } = require('./db/database');
const { User, Subject, Question, Exam } = require('./models');
const bcrypt = require('bcrypt');

const seed = async () => {
    try {
        const force = process.argv.includes('--force');
        if (force) {
            console.log('Force flag detected. Resetting database...');
        }
        await sequelize.sync({ force: force });

        // 1. Create Users (only if they don't exist or force was used)
        const adminPass = await bcrypt.hash('Admin123', 10);
        const studentPass = await bcrypt.hash('Student123', 10);

        if (force || (await User.count()) === 0) {
            await User.bulkCreate([
                { username: 'Admin User', email: 'admin@demo.com', password: adminPass, role: 'admin' },
                { username: 'Student User', email: 'student@demo.com', password: studentPass, role: 'student' }
            ]);
            console.log('Users created.');
        }

        // 2. Create Subjects
        const subjectsData = [
            { name: 'English' },
            { name: 'Mathematics' },
            { name: 'Science' },
            { name: 'Reasoning' },
            { name: 'Computer Science' },
            { name: 'General Knowledge' },
            { name: 'Urdu' },
            { name: 'Social Studies' }
        ];

        // Find or create subjects
        const subjects = [];
        for (const s of subjectsData) {
            const [subj] = await Subject.findOrCreate({ where: { name: s.name } });
            subjects.push(subj);
        }

        // 3. Create Questions
        // Helper to add questions
        const questions = [];
        const addQ = (text, options, correct, diff, subIdx) => {
            questions.push({
                text,
                options: options,
                correctOption: correct, // 1-4
                difficulty: diff,
                SubjectId: subjects[subIdx].id
            });
        };

        // English (Subject 0)
        addQ('Choose the synonym of "Happy".', ['Sad', 'Joyful', 'Angry', 'Tired'], 2, 'easy', 0);
        addQ('Identify the noun: "The cat runs fast."', ['The', 'Cat', 'Runs', 'Fast'], 2, 'easy', 0);
        addQ('Fill in the blank: He ___ to the market yesterday.', ['Go', 'Gone', 'Went', 'Going'], 3, 'easy', 0);
        addQ('Antonym of "Ancient"?', ['Old', 'Modern', 'Antique', 'Past'], 2, 'medium', 0);
        addQ('Choose the correct spelling.', ['Recieve', 'Receive', 'Riceive', 'Receve'], 2, 'medium', 0);
        addQ('Idiom "Break a leg" means?', ['Hurt yourself', 'Good luck', 'Break a bone', 'Dance'], 2, 'medium', 0);
        addQ('Which is a conjunction?', ['And', 'Run', 'Blue', 'Slowly'], 1, 'hard', 0);
        addQ('Passive voice of "I ate an apple".', ['An apple was eaten by me', 'An apple is eaten by me', 'I was eating an apple', 'Apple ate me'], 1, 'hard', 0);

        // Mathematics (Subject 1)
        addQ('5 + 7 = ?', ['10', '11', '12', '13'], 3, 'easy', 1);
        addQ('Square root of 64?', ['6', '7', '8', '9'], 3, 'easy', 1);
        addQ('Value of Pi (approx)?', ['3.14', '2.14', '4.14', '3.41'], 1, 'easy', 1);
        addQ('15% of 200?', ['20', '30', '40', '25'], 2, 'medium', 1);
        addQ('Solve: 2x + 4 = 10', ['2', '3', '4', '5'], 2, 'medium', 1);
        addQ('Area of circle with radius 7?', ['154', '49', '44', '100'], 1, 'medium', 1);
        addQ('Derivative of x^2?', ['x', '2x', 'x^2', '2'], 2, 'hard', 1);
        addQ('Sum of angles in a triangle?', ['180', '360', '90', '270'], 1, 'hard', 1);

        // Science (Subject 2)
        addQ('Chemical symbol for Water?', ['HO', 'H2O', 'O2H', 'H2O2'], 2, 'easy', 2);
        addQ('Planet closest to Sun?', ['Venus', 'Earth', 'Mercury', 'Mars'], 3, 'easy', 2);
        addQ('Powerhouse of the cell?', ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi'], 2, 'medium', 2);
        addQ('Speed of light?', ['3x10^8 m/s', '3x10^6 m/s', '300 km/h', 'Sound speed'], 1, 'medium', 2);
        addQ('Atomic number of Carbon?', ['5', '6', '7', '8'], 2, 'medium', 2);
        addQ('Force = Mass x ?', ['Velocity', 'Acceleration', 'Distance', 'Time'], 2, 'hard', 2);

        // Reasoning (Subject 3)
        addQ('Odd one out: Apple, Banana, Carrot, Mango', ['Apple', 'Banana', 'Carrot', 'Mango'], 3, 'easy', 3);
        addQ('A is father of B. B is sister of C. How is A related to C?', ['Father', 'Uncle', 'Brother', 'Grandfather'], 1, 'easy', 3);
        addQ('Series: 2, 4, 8, 16, ?', ['30', '32', '24', '20'], 2, 'medium', 3);
        addQ('If CAT = 3120, DOG = ?', ['4157', '4158', '4156', '4150'], 1, 'hard', 3);
        addQ('Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?', ['7', '10', '12', '13'], 2, 'medium', 3);
        addQ('SCD, TEF, UGH, ____, WKL', ['CMN', 'UJI', 'VIJ', 'IJT'], 3, 'medium', 3);

        // CS (Subject 4)
        addQ('CPU stands for?', ['Central Process Unit', 'Central Processing Unit', 'Computer Personal Unit', 'Central Processor Unit'], 2, 'easy', 4);
        addQ('Which is not a programming language?', ['Python', 'Java', 'HTML', 'C++'], 3, 'easy', 4);
        addQ('Binary of 10?', ['1010', '1001', '1100', '1000'], 1, 'medium', 4);
        addQ('HTTP stands for?', ['HyperText Transfer Protocol', 'HyperText Test Protocol', 'High Transfer Text Protocol', 'None'], 1, 'medium', 4);
        addQ('Time complexity of Binary Search?', ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], 2, 'hard', 4);
        addQ('1 Byte = ? bits', ['4', '8', '16', '32'], 2, 'easy', 4);

        // GK (Subject 5)
        addQ('Capital of India?', ['Mumbai', 'Delhi', 'New Delhi', 'Kolkata'], 3, 'easy', 5);
        addQ('Largest ocean?', ['Atlantic', 'Indian', 'Pacific', 'Arctic'], 3, 'easy', 5);
        addQ('First man on Moon?', ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'Michael Collins'], 1, 'medium', 5);
        addQ('Currency of Japan?', ['Yuan', 'Won', 'Yen', 'Dollar'], 3, 'medium', 5);
        addQ('Who wrote the National Anthem of India?', ['Rabindranath Tagore', 'Bankim Chandra', 'Sarojini Naidu', 'None'], 1, 'medium', 5);
        addQ('Which planet is known as the Red Planet?', ['Venus', 'Mars', 'Jupiter', 'Saturn'], 2, 'easy', 5);

        // Urdu (Subject 6)
        addQ('Urdu script is written from?', ['Left to Right', 'Right to Left', 'Top to Bottom', 'Bottom to Top'], 2, 'easy', 6);
        addQ('Who is the national poet of Pakistan?', ['Ghalib', 'Iqbal', 'Faiz', 'Mir'], 2, 'medium', 6);
        addQ('Meaning of "Aab"?', ['Fire', 'Water', 'Air', 'Earth'], 2, 'easy', 6);
        addQ('First letter of Urdu alphabet?', ['Alif', 'Bay', 'Pay', 'Jeem'], 1, 'easy', 6);
        addQ('Famous Urdu novel "Umrao Jaan Ada" written by?', ['Premchand', 'Ruswa', 'Manto', 'Chughtai'], 2, 'hard', 6);
        addQ('Synonym of "Khushi"?', ['Gham', 'Musarrat', 'Dukh', 'Takleef'], 2, 'medium', 6);

        // Social Studies (Subject 7)
        addQ('Democracy means rule by?', ['King', 'Military', 'People', 'Rich'], 3, 'easy', 7);
        addQ('Longest river in the world?', ['Nile', 'Amazon', 'Ganges', 'Yangtze'], 1, 'medium', 7);
        addQ('Which continent is known as the Dark Continent?', ['Asia', 'Africa', 'Europe', 'Australia'], 2, 'medium', 7);
        addQ('Who was the first President of USA?', ['Lincoln', 'Washington', 'Kennedy', 'Roosevelt'], 2, 'easy', 7);
        addQ('French Revolution started in?', ['1789', '1799', '1776', '1800'], 1, 'hard', 7);
        addQ('Largest desert in the world?', ['Sahara', 'Gobi', 'Antarctic', 'Arabian'], 3, 'hard', 7);

        // Only create questions if they don't exist (to prevent duplicates on re-seed without force)
        // But bulkCreate without updateOnDuplicate might fail if unique constraints exist (none on text).
        // For simplicity, if force is false, we just append.
        await Question.bulkCreate(questions.map(q => ({
            ...q,
            options: JSON.stringify(q.options)
        })));
        console.log(`Added ${questions.length} questions.`);

        // 4. Create Exams (only if none exist or force)
        if (force || (await Exam.count()) === 0) {
            await Exam.bulkCreate([
                { title: 'English Basic Test', duration: 10, questionCount: 10, isActive: true, SubjectId: subjects[0].id },
                { title: 'Mathematics Aptitude Test', duration: 20, questionCount: 10, isActive: true, SubjectId: subjects[1].id },
                { title: 'Science Knowledge Test', duration: 15, questionCount: 8, isActive: true, SubjectId: subjects[2].id },
                { title: 'General Knowledge Test', duration: 12, questionCount: 12, isActive: true, SubjectId: subjects[5].id },
                { title: 'Full Mock Test (Hard)', duration: 30, questionCount: 20, isActive: true, SubjectId: subjects[1].id }
            ]);
            console.log('Exams created.');
        }

        console.log('Database seeded successfully with realistic data!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await sequelize.close();
    }
};

seed();
