import { Toaster } from 'react-hot-toast';
import { SimpleSolitaire } from './components/SimpleSolitaire';

function App() {
  return (
    <div className="w-full min-h-screen">
      <SimpleSolitaire />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #475569',
          },
        }}
      />
    </div>
  );
}

export default App;