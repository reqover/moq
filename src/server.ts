import App from './app';
import IndexRoute from '@routes/index.route';
import validateEnv from '@utils/validateEnv';
import { MockRoute } from './routes/mock.route';
import { ProxyRoute } from './routes/proxy.route';

validateEnv();

const app = new App([new IndexRoute(), new ProxyRoute(), new MockRoute()]);

app.listen();
