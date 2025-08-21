// force-app/main/default/lwc/stdDataExplorer/stdDataExplorer.js
industry: this.industry,
rating: this.rating,
minAnnualRevenue: this.minAnnualRevenue,
pageSize: PAGE_SIZE,
pageNumber: this.pageNumber
});
this.total = res.total;
this.pageNumber = res.pageNumber;
const newRows = res.records || [];
this.rows = reset ? newRows : [...this.rows, ...newRows];
} catch (e) {
this.notify('Error loading accounts', e?.body?.message || e.message, 'error');
} finally {
this.isLoading = false;
}
}


handleLoadMore() {
if (this.rows.length >= this.total) return; // all loaded
this.pageNumber += 1;
this.fetchPage(false);
}


handleRowSelection(event) {
const selected = event.detail.selectedRows || [];
this.selectedRowIds = selected.map(r => r.Id);
if (selected.length > 0) {
this.selectedAccountId = selected[0].Id;
this.selectedAccountName = selected[0].Name;
this.loadRelated();
}
}


async loadRelated() {
if (!this.selectedAccountId) return;
try {
const r = await getRelated({
accountId: this.selectedAccountId,
contactPage: 1,
oppPage: 1,
pageSize: 50,
openOnly: this.openOnly
});
this.related = r || { contacts: [], contactTotal: 0, opportunities: [], opportunityTotal: 0 };
} catch (e) {
this.notify('Error loading related data', e?.body?.message || e.message, 'error');
}
}


toggleOpenOnly(e) {
this.openOnly = e.target.checked;
this.loadRelated();
}


async handleSave(evt) {
const changes = evt.detail.draftValues || [];
if (!changes.length) return;


// Use UI API updateRecord for optimistic updates; fall back to Apex bulk for larger batches
try {
await Promise.all(
changes.map(dv => updateRecord({ fields: { Id: dv.Id, Name: dv.Name, Phone: dv.Phone, Website: dv.Website, Industry: dv.Industry, Rating: dv.Rating, AnnualRevenue: dv.AnnualRevenue } }))
);
this.notify('Saved', `${changes.length} account(s) updated`, 'success');
this.draftValues = [];
// Refresh current page
this.pageNumber = 1;
this.rows = [];
await this.fetchPage(true);
} catch (e) {
// Optional fallback: bulk Apex to consolidate errors
try {
const result = await bulkUpdateAccounts({ updates: changes });
const failures = (result || []).filter(r => !r.success);
if (failures.length) {
const msg = failures.map(f => `${f.id}: ${f.error}`).join('\n');
this.notify('Some records failed', msg, 'error');
} else {
this.notify('Saved', `${changes.length} account(s) updated`, 'success');
}
this.draftValues = [];
this.pageNumber = 1;
this.rows = [];
await this.fetchPage(true);
} catch (e2) {
this.notify('Save failed', e2?.body?.message || e2.message, 'error');
}
}
}


handleRowAction() { /* reserved for future actions */ }


notify(title, message, variant) {
this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
}


// lifecycle
connectedCallback() {
this.fetchPage(true);
}
}
