import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ConfigUpload } from './pages/config-upload/config-upload';
import { Chat } from './pages/chat/chat';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Daver - Home'
  },
  {
    path: 'config',
    component: ConfigUpload,
    title: 'Daver - Upload Configuration'
  },
  {
    path: 'chat',
    component: Chat,
    title: 'Daver - Chat'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
