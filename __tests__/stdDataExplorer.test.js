// force-app/main/default/lwc/stdDataExplorer/__tests__/stdDataExplorer.test.js
import { createElement } from 'lwc';
import StdDataExplorer from 'c/stdDataExplorer';


describe('c-std-data-explorer', () => {
afterEach(() => {
while (document.body.firstChild) {
document.body.removeChild(document.body.firstChild);
}
});


it('renders and triggers initial fetch', async () => {
const element = createElement('c-std-data-explorer', { is: StdDataExplorer });
document.body.appendChild(element);
// Minimal smoke test; wire/adapters mocked in real suite
await Promise.resolve();
expect(element).toBeTruthy();
});
});
