import React, { useState, useEffect, useRef } from 'react';
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
const departureFlights = [
  {
    id: "d1",
    airline: "United",
    departure: "SFO 12:45AM",
    arrival: "BWI 11:45AM",
    stops: "1 stop (IAH)",
    price: 164,
    duration: "8 hr"
  },
  {
    id: "d2",
    airline: "American",
    departure: "SFO 5:05AM",
    arrival: "DCA 3:58PM",
    stops: "1 stop (1 hr 14 min CLT)",
    price: 196,
    duration: "7 hr 53 min"
  },
  {
    id: "d3",
    airline: "American",
    departure: "SFO 5:05AM",
    arrival: "IAD 5:04PM",
    stops: "1 stop (2 hr 14 min CLT)",
    price: 196,
    duration: "8 hr 59 min"
  },
  {
    id: "d4",
    airline: "American",
    departure: "SFO 6:05AM",
    arrival: "DCA 4:48PM",
    stops: "1 stop (47 min PHL)",
    price: 196,
    duration: "7 hr 43 min"
  },
  {
    id: "d5",
    airline: "United",
    departure: "SFO 9:10AM",
    arrival: "BWI 5:40PM",
    stops: "Nonstop",
    price: 227,
    duration: "5 hr 30 min"
  },
  {
    id: "d6",
    airline: "Alaska",
    departure: "SFO 7:08AM",
    arrival: "IAD 6:14PM",
    stops: "1 stop (1 hr 16 min SAN)",
    price: 229,
    duration: "8 hr 6 min"
  },
  {
    id: "d7",
    airline: "Alaska",
    departure: "SFO 9:39AM",
    arrival: "DCA 5:59PM",
    stops: "Nonstop",
    price: 239,
    duration: "5 hr 20 min"
  },
  {
    id: "d8",
    airline: "Southwest",
    departure: "SFO 5:10AM",
    arrival: "DCA 4:40PM",
    stops: "1 stop (2 hr 20 min LAS)",
    price: 248,
    duration: "8 hr 30 min"
  },
  {
    id: "d9",
    airline: "American",
    departure: "SFO 5:30AM",
    arrival: "DCA 3:59PM",
    stops: "1 stop (45 min DFW)",
    price: 289,
    duration: "7 hr 29 min"
  },
  {
    id: "d10",
    airline: "Southwest",
    departure: "SFO 6:20AM",
    arrival: "BWI 4:30PM",
    stops: "1 stop (1 hr 15 min DEN)",
    price: 292,
    duration: "7 hr 10 min"
  }
];

// --- Return flight data extracted from screenshots ---
const returnFlights = [
  {
    id: "r1",
    airline: "JetBlue",
    departure: "DCA 3:20PM",
    arrival: "SFO 11:51PM",
    stops: "1 stop (2 hr 53 min FLL)",
    price: 265,
    duration: "11 hr 31 min"
  },
  {
    id: "r2",
    airline: "United",
    departure: "BWI 6:52PM",
    arrival: "SFO 9:43PM",
    stops: "Nonstop",
    price: 269,
    duration: "5 hr 51 min"
  },
  {
    id: "r3",
    airline: "United",
    departure: "IAD 5:48PM",
    arrival: "SFO 8:30PM",
    stops: "Nonstop",
    price: 275,
    duration: "5 hr 42 min"
  },
  {
    id: "r4",
    airline: "United",
    departure: "IAD 6:35PM",
    arrival: "SFO 9:28PM",
    stops: "Nonstop",
    price: 275,
    duration: "5 hr 53 min"
  },
  {
    id: "r5",
    airline: "United",
    departure: "IAD 12:40PM",
    arrival: "SFO 3:28PM",
    stops: "Nonstop",
    price: 306,
    duration: "5 hr 48 min"
  },
  {
    id: "r6",
    airline: "Southwest",
    departure: "BWI 2:00PM",
    arrival: "SFO 6:30PM",
    stops: "1 stop (40 min SAN)",
    price: 309,
    duration: "7 hr 30 min"
  },
  {
    id: "r7",
    airline: "United",
    departure: "IAD 2:47PM",
    arrival: "SFO 5:35PM",
    stops: "Nonstop",
    price: 309,
    duration: "5 hr 48 min"
  },
  {
    id: "r8",
    airline: "United",
    departure: "DCA 5:45PM",
    arrival: "SFO 8:42PM",
    stops: "Nonstop",
    price: 319,
    duration: "5 hr 57 min"
  },
  {
    id: "r9",
    airline: "Alaska",
    departure: "DCA 6:59PM",
    arrival: "SFO 9:54PM",
    stops: "Nonstop",
    price: 344,
    duration: "5 hr 55 min"
  }
];

function ScrollableFlightList({ children }) {
  const containerRef = useRef(null);
  const thumbRef = useRef(null);

  const updateThumb = () => {
    const el = containerRef.current;
    const thumb = thumbRef.current;
    if (!el || !thumb) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      thumb.style.opacity = "0";
      return;
    }
    thumb.style.opacity = "1";
    const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 28);
    const maxThumbTop = clientHeight - thumbHeight;
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${scrollRatio * maxThumbTop}px)`;
  };

  useEffect(() => {
    updateThumb();
    window.addEventListener('resize', updateThumb);
    return () => window.removeEventListener('resize', updateThumb);
  }, []);

  return (
    <div className="relative h-[380px]">
      <div
        ref={containerRef}
        onScroll={updateThumb}
        className="no-native-scrollbar h-full overflow-y-scroll pr-3 space-y-2"
      >
        {children}
      </div>
      <div className="absolute top-0 right-0 w-1.5 h-full rounded-full bg-[#f0dde4] pointer-events-none">
        <div ref={thumbRef} className="w-1.5 rounded-full bg-[#8E5A71] absolute top-0 right-0" />
      </div>
    </div>
  );
}

function FlightCard({ flight, selected, onSelect }) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 border-2 rounded-xl cursor-pointer transition-all ${selected ? 'border-[#8E5A71] bg-[#D4B5C1]' : 'border-[#8E5A71] bg-transparent hover:bg-[#D4B5C1]/50'}`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="font-black text-sm text-[#5A3A4A] truncate">{flight.airline}</div>
        <div className="text-[11px] font-bold leading-snug">
          {flight.departure} <span className="text-[#8E5A71]">→</span> {flight.arrival}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex flex-col items-end text-right text-[9px] font-bold text-[#8E5A71] leading-tight w-[68px]">
          <span>{flight.stops}</span>
          <span>⏱ {flight.duration}</span>
        </div>
        <div className="text-base font-black text-[#8E5A71] w-12 text-right">${flight.price}</div>
      </div>
    </div>
  );
}

function ResultsSection({ title, results }) {
  return (
    <div>
      <h3 className="font-black text-sm text-[#8E5A71] uppercase tracking-widest mb-3">{title}</h3>
      {results.length === 0 ? (
        <div className="text-center text-[#8E5A71] font-bold py-4 text-sm">No votes yet.</div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={result.id} className={`p-3 border-2 rounded-2xl border-[#8E5A71] ${index === 0 ? 'bg-[#D4B5C1]' : 'bg-transparent'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="font-black text-base text-[#5A3A4A]">
                  {index === 0 && "★ "}{result.airline} (${result.price})
                </div>
                <div className="border-2 border-[#8E5A71] rounded-full px-2 py-0.5 text-sm font-black text-[#8E5A71] bg-transparent">
                  {result.votes.length}
                </div>
              </div>
              <div className="space-y-1.5 mt-2 border-t-2 border-solid border-[#8E5A71] pt-2">
                {result.votes.map((v, i) => (
                  <div key={i} className="text-sm font-bold">
                    <span className="text-[#8E5A71] uppercase tracking-wider">{v.name}:</span>{" "}
                    <span className="text-[#5A3A4A]">"{v.note}"</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FlightVoter() {
  const [votes, setVotes] = useState([]);
  const [voterName, setVoterName] = useState("");
  const [selectedDeparture, setSelectedDeparture] = useState("");
  const [selectedReturn, setSelectedReturn] = useState("");
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
    if (!voterName || !selectedDeparture || !selectedReturn || !defenseNote) {
        alert("Please fill out all fields!");
        return;
    }

    // Save vote to your live Firebase database
    try {
        await addDoc(collection(db, "flightVotes"), {
            name: voterName,
            departureFlightId: selectedDeparture,
            returnFlightId: selectedReturn,
            note: defenseNote,
            timestamp: new Date().toISOString()
        });

        // Clear form
        setVoterName("");
        setSelectedDeparture("");
        setSelectedReturn("");
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

  // Calculate results per leg if they should be shown
  let departureResults = [];
  let returnResults = [];

  if (showResults && votes.length > 0) {
    departureResults = departureFlights
      .map(flight => ({ ...flight, votes: votes.filter(v => v.departureFlightId === flight.id) }))
      .filter(f => f.votes.length > 0)
      .sort((a, b) => b.votes.length - a.votes.length);

    returnResults = returnFlights
      .map(flight => ({ ...flight, votes: votes.filter(v => v.returnFlightId === flight.id) }))
      .filter(f => f.votes.length > 0)
      .sort((a, b) => b.votes.length - a.votes.length);
  }

  const selectedDepartureFlight = departureFlights.find(f => f.id === selectedDeparture);
  const selectedReturnFlight = returnFlights.find(f => f.id === selectedReturn);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ed] font-['Nunito',sans-serif]">
        <div className="text-xl text-[#8E5A71] animate-pulse font-bold tracking-widest uppercase">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ed] p-[11px] md:p-[22px] font-['Nunito',sans-serif] text-[#5A3A4A]">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
      `}} />

      <div className="max-w-4xl mx-auto rounded-3xl p-[17px] md:p-[28px] bg-[#faf8ed] relative">
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
                     arrive & depart DC between 11AM - 7PM
                   </span>
                 </li>
                 <li><strong>DCA:</strong> 30-45 mins</li>
                 <li><strong>BWI:</strong> 45-60 mins</li>
                 <li><strong>IAD:</strong> 60-90 mins. might be okay for return flight!</li>
             </ul>
         </div>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#8E5A71] mb-4 uppercase">
                  Departing Flights
              </h2>
              <ScrollableFlightList>
                  {departureFlights.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      selected={selectedDeparture === flight.id}
                      onSelect={() => setSelectedDeparture(flight.id)}
                    />
                  ))}
              </ScrollableFlightList>
            </div>

            <div>
              <h2 className="text-xl font-black text-[#8E5A71] mb-4 uppercase">
                  Returning Flights
              </h2>
              <ScrollableFlightList>
                  {returnFlights.map((flight) => (
                    <FlightCard
                      key={flight.id}
                      flight={flight}
                      selected={selectedReturn === flight.id}
                      onSelect={() => setSelectedReturn(flight.id)}
                    />
                  ))}
              </ScrollableFlightList>
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
                                <label className="block text-sm font-black text-[#8E5A71] mb-1 uppercase tracking-wider">Departing Flight</label>
                                <div className="w-full px-4 py-2 border-2 border-[#8E5A71] rounded-xl bg-transparent font-bold">
                                    {selectedDepartureFlight ? `${selectedDepartureFlight.airline} - $${selectedDepartureFlight.price}` : "tap an option"}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-black text-[#8E5A71] mb-1 uppercase tracking-wider">Returning Flight</label>
                                <div className="w-full px-4 py-2 border-2 border-[#8E5A71] rounded-xl bg-transparent font-bold">
                                    {selectedReturnFlight ? `${selectedReturnFlight.airline} - $${selectedReturnFlight.price}` : "tap an option"}
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
                                disabled={!selectedDeparture || !selectedReturn || !voterName || !defenseNote}
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
                            <div className="space-y-8">
                                <ResultsSection title="Departing Votes" results={departureResults} />
                                <ResultsSection title="Returning Votes" results={returnResults} />
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
