import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { questions } from './questions';

export default function App() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('1st');
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    let timer;
    if (started && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && started) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(45);
      } else {
        handleQuizEnd();
      }
    }
    return () => clearInterval(timer);
  }, [started, timeLeft, currentQuestion]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
      const querySnapshot = await getDocs(q);
      setLeaderboard(querySnapshot.docs.map(doc => doc.data()));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
      setLoading(false);
    }
  };

  const handleAnswer = (answer, index) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(45);
      } else {
        handleQuizEnd();
      }
    }, 500);
  };

  const handleQuizEnd = () => {
    setStarted(false);
    const score = answers.reduce((acc, ans, i) => 
      acc + (ans === questions[i].answer ? 1 : 0), 0);
    setTotalScore(score);
  };

  const handleSubmit = async () => {
    if (submitted) return;
    if (!name.trim() || !dept.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    try {
      setLoading(true);
      await addDoc(collection(db, "leaderboard"), { 
        name, department: dept, year, score: totalScore,
        timestamp: new Date().toISOString()
      });
      setSubmitted(true);
      window.history.pushState(null, null, window.location.href);
      window.onpopstate = () => {
        window.history.pushState(null, null, window.location.href);
      };
      await fetchLeaderboard();
      setLoading(false);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Failed to submit quiz");
      setLoading(false);
    }
  };

  if (!started && !submitted && answers.length === 0) {
    return (
      <div className="screen welcome-screen">
        <div className="container welcome-container">
          <div className="welcome-logo">
            <svg className="logo-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="8" strokeDasharray="283" strokeDashoffset="100" />
              <text x="50" y="60" fontFamily="Arial" fontSize="35" fill="white" textAnchor="middle" fontWeight="bold">SFS</text>
            </svg>
          </div>
          <h1 className="welcome-title">College Quiz Challenge</h1>
          <p className="welcome-description">
            {questions.length} questions • 45 seconds each • One attempt only
          </p>
          <button onClick={() => setStarted(true)} className="start-button">
            START QUIZ
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="screen leaderboard-screen">
        <div className="container leaderboard-container">
          <h1 className="leaderboard-title">Quiz Results 🏆</h1>
          <p className="results-score">Your Score: {totalScore}/{questions.length}</p>
          
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="leaderboard-table">
              <div className="table-header">
                <div className="header-rank">#</div>
                <div className="header-name">Name</div>
                <div className="header-score">Score</div>
              </div>
              <div className="table-body">
                {leaderboard.slice(0, 10).map((entry, i) => (
                  <div key={i} className={`table-row ${entry.name === name ? "highlight-row" : ""}`}>
                    <div className="row-rank">{i + 1}</div>
                    <div className="row-name">{entry.name}</div>
                    <div className="row-score">{entry.score}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!started && answers.length > 0) {
    return (
      <div className="screen results-screen">
        <div className="container results-container">
          <div className="results-header">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="results-title">Quiz Completed!</h1>
            <p className="results-score">Your Score: {totalScore}/{questions.length}</p>
          </div>
          
          <div className="form-container">
            <h2 className="form-title">Register Your Score</h2>
            {error && <p className="form-error">{error}</p>}
            
            <div className="form-fields">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-button"
            >
              {loading ? "Submitting..." : "SUBMIT SCORE"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen quiz-screen">
      <div className="container quiz-container">
        <div className="quiz-header">
          <div className="question-counter">
            <span className="current-question">{currentQuestion + 1}</span>
            <span className="counter-separator">/</span>
            <span className="total-questions">{questions.length}</span>
          </div>
          
          <div className={`timer ${timeLeft < 10 ? 'time-warning' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="time-display">{timeLeft}s</span>
          </div>
        </div>
        
        <div className="question-container">
          <h2 className="question-text">{questions[currentQuestion].q}</h2>
        </div>
        
        <div className="options-container">
          {questions[currentQuestion].options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(option, i)}
              className={`option-btn ${answers[currentQuestion] === option ? 'option-selected' : ''}`}
            >
              <div className="option-content">
                <div className={`option-letter ${answers[currentQuestion] === option ? 'letter-selected' : ''}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="option-text">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
