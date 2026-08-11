import { createRoot } from 'react-dom/client';
import { App } from './App';
import { Providers } from './components/Providers';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <Providers>
    <App />
  </Providers>,
);
