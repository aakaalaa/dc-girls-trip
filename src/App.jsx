import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, getDocs } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBNSnY-FhA6pZdO3tHavRhS4lJ6aG82JG0",
  authDomain: "dc-girls-trip.firebaseapp.com",
  projectId: "dc-girls-trip",
  storageBucket: "dc-girls-trip.firebasestorage.app",
  messagingSenderId: "677882296475",
  appId: "1:677882296475:web:c769df6fb928e3b738ae3e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Flight data extracted from screenshots ---
const flights = [
  {
    id: "f1",
    airline: "American",
    departure: "SFO 5:05 AM",
    arrival: "DCA 3:58 PM",
    stops: "1 stop (CLT)",
    price: 196,
    duration: "7 hr 53 min",
    co2: "398 kg",
    airportInfo: "DCA is ~17 miles (30-45 mins) from the airbnb."
  },
  {
    id: "f2",
    airline: "American",
    departure: "SFO 6:05 AM",
    arrival: "DCA 4:48 PM",
    stops: "1 stop (PHL)",
    price: 196,
    duration: "7 hr 43 min",
    co2: "344 kg",
    airportInfo: "DCA is ~17 miles (30-45 mins) from the airbnb."
  },
  {
    id: "f3",
    airline: "Southwest",
    departure: "SFO 5:10 AM",
    arrival: "BWI 5:05 PM",
    stops: "2 stops",
    price: 220,
    duration: "8 hr 55 min",
    co2: "395 kg",
    airportInfo: "BWI is ~30 miles (45-60 mins) from the airbnb."
  },
  {
    id: "f4",
    airline: "United",
    departure: "SFO 9:10 AM",
    arrival: "BWI 5:40 PM",
    stops: "Nonstop",
    price: 227,
    duration: "5 hr 30 min",
    co2: "268 kg",
    airportInfo: "BWI is ~30 miles (45-60 mins) from the airbnb."
  },
  {
    id: "f5",
    airline: "Southwest",
    departure: "SFO 5:10 AM",
    arrival: "DCA 4:40 PM",
    stops: "1 stop (LAS)",
    price: 248,
    duration: "8 hr 30 min",
    co2: "353 kg",
    airportInfo: "DCA is ~17 miles (30-45 mins) from the airbnb."
  },
  {
    id: "f6",
    airline: "Southwest",
    departure: "SFO 6:20 AM",
    arrival: "BWI 4:30 PM",
    stops: "1 stop (DEN)",
    price: 292,
    duration: "7 hr 10 min",
    co2: "319 kg",
    airportInfo: "BWI is ~30 miles (45-60 mins) from the airbnb."
  },
  {
     id: "f7",
     airline: "United",
     departure: "IAD 12:40 PM",
     arrival: "SFO 3:28 PM",
     stops: "Nonstop",
     price: 306,
     duration: "5 hr 48 min",
     co2: "326 kg",
     airportInfo: "IAD is ~45 miles (60-90+ mins) from the airbnb."
  }
];

export default function FlightVoter() {
  const [votes, setVotes] = useState([]);
  const [voterName, setVoterName] = useState("");
  const [selectedFlight, setSelectedFlight] = useState("");
  const [defenseNote, setDefenseNote] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);

  // Real-time listener: Fetches live votes from YOUR Firebase database
  useEffect(() => {
    const q = query(collection(db, "flightVotes"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const voteData = [];
      snapshot.forEach((doc) => {
        voteData.push({ id: doc.id, ...doc.data() });
      });
      setVotes(voteData);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const submitVote = async (e) => {
    e.preventDefault();
    if (!voterName || !selectedFlight || !defenseNote) {
        alert("Please fill out all fields!");
        return;
    }

    // Save vote to your live Firebase database
    try {
        await addDoc(collection(db, "flightVotes"), {
            name: voterName,
            flightId: selectedFlight,
            note: defenseNote,
            timestamp: new Date().toISOString()
        });

        // Clear form
        setVoterName("");
        setSelectedFlight("");
        setDefenseNote("");
    } catch (error) {
        console.error("Error adding vote: ", error);
        alert("Oops! Could not save the vote.");
    }
  };

  const handleResetVotes = async () => {
    // Deletes all votes from the database so you can start over
    try {
        const querySnapshot = await getDocs(collection(db, "flightVotes"));
        querySnapshot.forEach(async (document) => {
            await deleteDoc(document.ref);
        });
        setShowResults(false);
    } catch (error) {
        console.error("Error resetting votes: ", error);
    }
  };

  // Calculate results if they should be shown
  let resultsSummary = [];
  let winningFlightId = null;

  if (showResults && votes.length > 0) {
    const voteCounts = {};
    votes.forEach(vote => {
      voteCounts[vote.flightId] = (voteCounts[vote.flightId] || 0) + 1;
    });

    // Find winner
    let maxVotes = 0;
    for (const [flightId, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
            maxVotes = count;
            winningFlightId = flightId;
        }
    }

    // Group votes by flight for display
    resultsSummary = flights.map(flight => {
        const flightVotes = votes.filter(v => v.flightId === flight.id);
        return {
            ...flight,
            votes: flightVotes
        };
    }).filter(f => f.votes.length > 0);

    // Sort so winner is first
    resultsSummary.sort((a, b) => b.votes.length - a.votes.length);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ed] font-['Nunito',sans-serif]">
        <div className="text-xl text-[#8E5A71] animate-pulse font-bold tracking-widest uppercase">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ed] p-4 md:p-8 font-['Nunito',sans-serif] text-[#5A3A4A]">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      `}} />

      <div className="max-w-4xl mx-auto rounded-3xl p-6 md:p-10 bg-[#faf8ed] relative">
        <div className="absolute top-4 left-4 text-[#8E5A71] text-2xl rotate-12">✧</div>
        <div className="absolute top-4 right-4 text-[#8E5A71] text-2xl -rotate-12">✧</div>
        <div className="absolute bottom-4 left-4 text-[#8E5A71] text-2xl -rotate-45">✧</div>
        <div className="absolute bottom-4 right-4 text-[#8E5A71] text-2xl rotate-45">✧</div>

        <header className="text-center mb-10 mt-4">
          <h1 className="text-4xl md:text-5xl font-black text-[#8E5A71] tracking-wide mb-3 uppercase">
            Afro+ Fest Flight Picker
          </h1>
        </header>

         <div className="bg-transparent border-2 border-[#8E5A71] rounded-2xl p-4 mb-8 text-sm">
             <h3 className="font-bold text-[#8E5A71] mb-2 uppercase tracking-widest text-xs">Notes:</h3>
             <ul className="list-disc pl-5 space-y-1.5 font-semibold">
                 <li>
                   These are the cheapest flights that{" "}
                   <span className="bg-[#D4B5C1] text-[#5A3A4A] px-2 py-0.5 rounded-md font-bold inline-block">
                     Arrive in DC 11am-6pm
                   </span>{" "}
                   and{" "}
                   <span className="bg-[#D4B5C1] text-[#5A3A4A] px-2 py-0.5 rounded-md font-bold inline-block">
                     Depart 11am-7pm
                   </span>
                   .
                 </li>
                 <li><strong>DCA:</strong> 30-45 mins</li>
                 <li><strong>BWI:</strong> 45-60 mins</li>
                 <li><strong>IAD:</strong> might be okay for return flight!</li>
             </ul>
         </div>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="space-y-4">
            <h2 className="text-xl font-black text-[#8E5A71] mb-4 border-b-2 border-solid border-[#8E5A71] pb-2 uppercase">
                The Options
            </h2>
            <div className="h-[600px] overflow-y-auto pr-2 space-y-4">
                {flights.map((flight) => (
                <div
                    key={flight.id}
                    className={`bg-transparent p-4 border-2 rounded-2xl transition-all cursor-pointer ${selectedFlight === flight.id ? 'border-[#8E5A71] bg-[#D4B5C1]' : 'border-[#8E5A71] hover:bg-[#D4B5C1]/50'}`}
                    onClick={() => setSelectedFlight(flight.id)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="font-black text-xl text-[#5A3A4A]">{flight.airline}</span>
                            <div className="text-sm font-bold text-[#8E5A71]">{flight.stops}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-[#8E5A71]">${flight.price}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm my-3 border-t-2 border-b-2 border-solid border-[#8E5A71] py-2">
                        <div>
                            <span className="block text-[#8E5A71] text-xs font-bold uppercase tracking-wider">Depart</span>
                            <span className="font-bold">{flight.departure}</span>
                        </div>
                        <div>
                            <span className="block text-[#8E5A71] text-xs font-bold uppercase tracking-wider">Arrive</span>
                            <span className="font-bold">{flight.arrival}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-[#8E5A71]">
                        <span className="flex items-center gap-1">⏱ {flight.duration}</span>
                        <span className="flex items-center gap-1">🌱 {flight.co2}</span>
                    </div>
                </div>
                ))}
            </div>
          </div>

          <div>
            <div className="bg-transparent p-6 border-2 border-[#8E5A71] rounded-3xl sticky top-8">
                {!showResults ? (
                    <>
                        <h2 className="text-2xl font-black text-[#8E5A71] mb-6 text-center uppercase tracking-widest">Vote Here</h2>

                        <div className="text-center mb-6">
                            <span className="inline-flex items-center justify-center border-2 border-[#8E5A71] rounded-full text-[#8E5A71] font-bold px-4 py-1 text-sm bg-[#D4B5C1]">
                                {votes.length} {votes.length === 1 ? 'girl has' : 'girls have'} voted!
                            </span>
                        </div>

                        <form onSubmit={submitVote} className="space-y-4">
                            <div>
                                <label className="block text-sm font-black text-[#8E5A71] mb-1 uppercase tracking-wider">Name</label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={voterName}
                                    onChange={(e) => setVoterName(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-[#8E5A71] rounded-xl bg-transparent focus:outline-none focus:bg-[#D4B5C1]/30 font-bold placeholder-[#8E5A71]/50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#8E5A71] mb-1 uppercase tracking-wider">Flight</label>
                                <div className="w-full px-4 py-2 border-2 border-[#8E5A71] rounded-xl bg-transparent font-bold">
                                    {selectedFlight ? flights.find(f => f.id === selectedFlight)?.airline + " - $" + flights.find(f => f.id === selectedFlight)?.price : "Tap an option..."}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#8E5A71] mb-1 uppercase tracking-wider">Why?</label>
                                <textarea
                                    placeholder="Defend your choice..."
                                    value={defenseNote}
                                    onChange={(e) => setDefenseNote(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-[#8E5A71] rounded-xl bg-transparent focus:outline-none focus:bg-[#D4B5C1]/30 font-bold h-24 resize-none placeholder-[#8E5A71]/50"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!selectedFlight || !voterName || !defenseNote}
                                className="w-full bg-[#8E5A71] text-[#E5D4DA] rounded-xl font-black py-3 px-4 uppercase tracking-widest hover:bg-[#5A3A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[#8E5A71]"
                            >
                                Submit Vote
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t-2 border-solid border-[#8E5A71] text-center">
                            <button
                                onClick={() => setShowResults(true)}
                                className="text-sm font-black text-[#8E5A71] hover:text-[#5A3A4A] underline underline-offset-4 uppercase tracking-widest"
                            >
                                Reveal Results
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-[#8E5A71] uppercase tracking-widest">The Verdict</h2>
                            <button
                                onClick={handleResetVotes}
                                className="text-xs text-[#8E5A71] hover:text-[#5A3A4A] font-bold border-b border-[#8E5A71]"
                            >
                                Reset
                            </button>
                        </div>

                        {votes.length === 0 ? (
                            <div className="text-center text-[#8E5A71] font-bold py-8">
                                No one has voted yet!
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {resultsSummary.map((result, index) => (
                                    <div key={result.id} className={`p-4 border-2 rounded-2xl border-[#8E5A71] ${index === 0 ? 'bg-[#D4B5C1]' : 'bg-transparent'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="font-black text-lg text-[#5A3A4A]">
                                                {index === 0 && "★ "} {result.airline} (${result.price})
                                            </div>
                                            <div className="border-2 border-[#8E5A71] rounded-full px-2 py-1 text-sm font-black text-[#8E5A71] bg-transparent">
                                                {result.votes.length}
                                            </div>
                                        </div>

                                        <div className="space-y-2 mt-3 border-t-2 border-solid border-[#8E5A71] pt-3">
                                            {result.votes.map((v, i) => (
                                                <div key={i} className="p-2 text-sm font-bold">
                                                    <span className="text-[#8E5A71] uppercase tracking-wider block mb-1">{v.name}:</span>
                                                    <span className="text-[#5A3A4A]">"{v.note}"</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setShowResults(false)}
                                className="text-sm font-black text-[#8E5A71] hover:text-[#5A3A4A] underline uppercase tracking-widest"
                            >
                                Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
