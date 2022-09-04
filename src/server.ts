import App from './app';
import validateEnv from './utils/validateEnv';
import { MockRoute } from './routes/mock.route';
import { ProxyRoute } from './routes/proxy.route';

validateEnv();

const app = new App([new ProxyRoute(), new MockRoute()]);

app.listen();
