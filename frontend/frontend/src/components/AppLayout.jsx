import { Outlet, useMatches } from 'react-router-dom'; // ⭐ Change useLoaderData to useMatches
import SettingsButton from '@/components/buttons/SettingsButton';
import useCustomCursor from '@/hooks/useCustomCursor.jsx';
import { BGMProvider } from '@/context/BGMContext';

export default function AppLayout({ exclude = false }) {
  // ⭐ Fix: Use useMatches to find the current route's data
  const matches = useMatches();
  
  // Look through the matched routes (parent -> child) to find one that has gameMode data
  const currentMatch = matches.find((match) => match.data?.gameMode);
  const gameMode = currentMatch?.data?.gameMode ?? null;

  const Cursor = useCustomCursor();
  const showSettings = !exclude;

  return (
    /* Your BGMProvider placement here is correct! */
    <BGMProvider>
      <div className="app-layout">
        <Outlet />
        {Cursor}
        {showSettings && <SettingsButton gameMode={gameMode} />}
      </div>
    </BGMProvider>
  );
}