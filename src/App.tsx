/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Header } from "./components/Header";
import { KPICards } from "./components/KPICards";
import { StadiumView } from "./components/StadiumView";
import { AlertsPanel } from "./components/AlertsPanel";
import { PredictiveTimeline } from "./components/PredictiveTimeline";
import { FooterPanels } from "./components/FooterPanels";
import { LiveMatchContext } from "./components/LiveMatchContext";
import { FanDashboard } from "./components/FanDashboard";
import { FeatureRoadmap } from "./components/FeatureRoadmap";
import { WorldMap } from "./components/WorldMap";

export default function App() {
  const [view, setView] = useState<'ops' | 'fan' | 'roadmap' | 'world'>('ops');

  return (
    <div className="flex flex-col h-screen overflow-auto bg-[#0A1628] text-white">
      <Header currentView={view} onViewChange={setView} />
      
      {view === 'ops' ? (
        <>
          <div className="shrink-0">
            <KPICards />
          </div>
          
          {/* Main Grid area */}
          <main className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-auto">
            <div className="col-span-7 flex flex-col gap-4 h-full">
              <div className="shrink-0">
                <LiveMatchContext />
              </div>
              <div className="flex-1 min-h-0 max-h-[75vh]">
                <StadiumView />
              </div>
            </div>
            <div className="col-span-5 flex flex-col gap-4 h-full">
              <div className="flex-1 min-h-[350px]">
                <AlertsPanel />
              </div>
              <div className="shrink-0 h-[280px]">
                <PredictiveTimeline />
              </div>
            </div>
          </main>

          <div className="shrink-0">
            <FooterPanels />
          </div>
        </>
      ) : view === 'fan' ? (
        <main className="flex-1 p-6 overflow-auto">
          <FanDashboard />
        </main>
      ) : view === 'roadmap' ? (
        <main className="flex-1 p-6 overflow-auto">
          <FeatureRoadmap />
        </main>
      ) : (
        <main className="flex-1 p-6 overflow-auto">
          <WorldMap />
        </main>
      )}
    </div>
  );
}
