import { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';

export default function IdeaVotingWidget() {
  // State for storing ideas and modal visibility
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentIdea, setCurrentIdea] = useState(null);
  const [sortOrder, setSortOrder] = useState('default'); // default, upvotes, downvotes
  const [sortedIdeas, setSortedIdeas] = useState([]);

  // Fetch ideas from API on component mount
  useEffect(() => {
    console.log('fff')
    const fetchIdeas = async () => {
      setIsLoading(true);
      try {
        // Try to get ideas from localStorage first
        const savedIdeas = localStorage.getItem('beastScanIdeas');
        if (savedIdeas) {
          setIdeas(JSON.parse(savedIdeas));
          setIsLoading(false);
          return;
        }
        
        // If no saved ideas, fetch from API
        // In a real implementation, replace with actual API endpoint
        // For this demo, we'll use mock data
        const res = await fetch('https://my.beastscan.com/test-kit');
        const mockData = await res.json();
        const data = mockData?.map((rows, idx) => ({ ...rows, id: idx+1 }))
        
        setIdeas(data);
        // Save to localStorage
        localStorage.setItem('beastScanIdeas', JSON.stringify(data));
      } catch (err) {
        setError("Failed to fetch ideas. Please try again later.");
        console.error("Error fetching ideas:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchIdeas();
  }, []);
  

  // Save ideas to localStorage whenever they change
  useEffect(() => {
    if (ideas.length > 0) {
      setSortedIdeas(ideas);
      localStorage.setItem('beastScanIdeas', JSON.stringify(ideas));
    }
  }, [ideas]);

  // Handle voting
  const handleVote = (id, voteType) => {
    console.log('id',id, voteType)
    setSortedIdeas(prevIdeas => {
      return prevIdeas.map(idea => {
        if (idea.id === id) {
          const isUp = voteType === 'up'
          return { 
            ...idea, 
            votes: { 
              ...idea.votes, 
              [voteType]: isUp ? idea.votes.up + 1 : 
              idea.votes.down !== 0 ? idea.votes.down - 1 : 0
            } 
          }
        }
        return idea;
      });
    });
  };

  // Open edit modal
  const openEditModal = (idea) => {
    setCurrentIdea({ ...idea });
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('name,', name, value);
    let update = {};
    if (name?.includes('label') ||name?.includes('url')) {
      const prevBtn = ideas?.find(row => row.id === currentIdea.id).button;
      update = {
        button: {
          ...prevBtn,
          [name]: value
        }
      }
    } else {
      update = {
        [name]: value
      }
    }
    setCurrentIdea(prev => ({ ...prev, ...update }));
  };

  // Save edited idea
  const saveIdea = (e) => {
    console.log(e)
    e.preventDefault();
    setSortedIdeas(prevIdeas => {
      return prevIdeas.map(idea => {
        if (idea.id === currentIdea.id) {
          return { ...currentIdea };
        }
        return idea;
      });
    });
    setShowModal(false);
  };

  // Reset all ideas to original state
  const resetAllIdeas = () => {
    localStorage.removeItem('beastScanIdeas');
    setIdeas([]);
    setIsLoading(true);
    // Trigger re-fetch by clearing and setting state
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // Sort ideas based on selected order
  const sortIdeas = useCallback(
    (e) => {
      const value = e.target?.value;
      const sorted = ideas.sort((a, b) => {
        if (value === 'upvotes') {
          return b.votes.up - a.votes.up;
        } else if (value === 'downvotes') {
          return b.votes.down - a.votes.down;
        }
        return a.id - b.id; // default sorting by ID
      });
      setSortOrder(value);
      setSortedIdeas(sorted);
    },[ideas])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between mb-6 items-center">
        <h2 className="text-2xl font-bold text-gray-800">BeastScan Ideas</h2>
        <div className="flex gap-4">
          <select 
            className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sortOrder}
            onChange={(e) => sortIdeas(e)}
          >
            <option value="default">Sort by Default</option>
            <option value="upvotes">Sort by Upvotes</option>
            <option value="downvotes">Sort by Downvotes</option>
          </select>
          <button 
            onClick={resetAllIdeas}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
          >
            Reset All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedIdeas?.map(idea => (
          <div key={idea.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300">
            <img 
              src={idea.image} 
              alt={idea.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{idea.title}</h3>
              <p className="text-gray-600 mb-4">{idea.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleVote(idea.id, 'up')}
                      className="text-gray-500 hover:text-green-500 focus:outline-none transition duration-300"
                      aria-label="Upvote"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <span className="ml-1 text-gray-700">{idea.votes.up}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleVote(idea.id, 'down')}
                      className="text-gray-500 hover:text-red-500 focus:outline-none transition duration-300"
                      aria-label="Downvote"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <span className="ml-1 text-gray-700">{idea.votes.down}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => openEditModal(idea)}
                  className="text-blue-500 hover:text-blue-700 focus:outline-none transition duration-300"
                  aria-label="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              <a 
                href={idea.button.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-2 rounded transition duration-300"
              >
                {idea.button.label}
              </a>
            </div>
          </div>
        ))}
      </div>

      {showModal && currentIdea && (<Modal currentIdea={currentIdea} handleClose={() => setShowModal(false)} handleSave={(e) => saveIdea(e)} handleChange={(e) => handleInputChange(e)} />)}
    </div>
  );
}