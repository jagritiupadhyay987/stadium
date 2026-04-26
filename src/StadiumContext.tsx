import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Stadium, DEFAULT_STADIUM_ID } from './stadiums';
const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

interface StadiumContextType {
  selectedStadium: Stadium | null;
  stadiums: Stadium[];
  selectStadium: (stadium: Stadium) => void;
  isLoading: boolean;
  error: string | null;
}

const StadiumContext = createContext<StadiumContextType | undefined>(undefined);

export function StadiumProvider({ children }: { children: ReactNode }) {
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all stadiums on mount
  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/stadiums`);
        if (!response.ok) throw new Error('Failed to fetch stadiums');
        const data = await response.json();
        setStadiums(data);
        
        // Auto-select default stadium if none selected
        if (!selectedStadium) {
          const defaultStadium = data.find((s: Stadium) => s.id === DEFAULT_STADIUM_ID);
          if (defaultStadium) {
            fetchStadiumDetails(defaultStadium.id);
          }
        }
      } catch (err) {
        console.error('Error fetching stadiums:', err);
        setError('Failed to load stadiums database');
      }
    };

    fetchStadiums();
  }, []);

  const fetchStadiumDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/stadiums/${id}`);
      if (!response.ok) throw new Error('Failed to fetch stadium details');
      const data = await response.json();
      setSelectedStadium(data);
    } catch (err) {
      console.error('Error fetching stadium details:', err);
      setError('Failed to load stadium data');
    } finally {
      setIsLoading(false);
    }
  };

  const selectStadium = (stadium: Stadium) => {
    fetchStadiumDetails(stadium.id);
  };

  return (
    <StadiumContext.Provider value={{ selectedStadium, stadiums, selectStadium, isLoading, error }}>
      {children}
    </StadiumContext.Provider>
  );
}

export function useStadium() {
  const context = useContext(StadiumContext);
  if (context === undefined) {
    throw new Error('useStadium must be used within a StadiumProvider');
  }
  return context;
}
