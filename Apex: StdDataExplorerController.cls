// force-app/main/default/classes/StdDataExplorerController.cls
// Production-ready controller with CRUD/FLS enforcement and safe server-side pagination.
// New technique highlights:
// - Security.stripInaccessible() on reads/updates.
// - Cacheable methods with page sizes + guards.
// - Whitelisted dynamic SOQL filters to prevent injection.


public with sharing class StdDataExplorerController {
public class SearchResult {
@AuraEnabled public List<Account> records;
@AuraEnabled public Integer total;
@AuraEnabled public Integer pageNumber;
@AuraEnabled public Integer pageSize;
}


public class RelatedResult {
@AuraEnabled public List<Contact> contacts;
@AuraEnabled public Integer contactTotal;
@AuraEnabled public List<Opportunity> opportunities;
@AuraEnabled public Integer opportunityTotal;
}


public class RowSaveResult {
@AuraEnabled public Id id;
@AuraEnabled public Boolean success;
@AuraEnabled public String error;
}


@AuraEnabled(cacheable=true)
public static SearchResult searchAccounts(
String searchTerm,
String industry,
String rating,
Decimal minAnnualRevenue,
Integer pageSize,
Integer pageNumber
) {
// Guards
Integer ps = (pageSize == null || pageSize <= 0) ? 50 : math.min(200, pageSize);
Integer pn = (pageNumber == null || pageNumber <= 0) ? 1 : pageNumber;


// Build where clause from whitelisted filters
List<String> whereClauses = new List<String>();
Map<String, Object> binds = new Map<String, Object>();


if (searchTerm != null && searchTerm.trim().length() > 0) {
// Use Name LIKE; additional fields can be added as needed
binds.put('nameLike', '%' + String.escapeSingleQuotes(searchTerm.trim()) + '%');
binds.put('rev', minAnnualRevenue);
whereClauses.add('AnnualRevenue >= :rev');
} whereClauses.add('Name LIKE :nameLike');
}
if (industry != null && industry.trim().length() > 0) {
binds.put('ind', industry);
whereClauses.add('Industry = :ind');
}
if (rating != null && rating.trim().length() > 0) {
binds.put('rat', rating);
whereClauses.add('Rating = :rat');
}
if (minAnnualRevenue != null && minAnnualRevenue > 0) {


String whereSql = whereClauses.isEmpty() ? '' : (' WHERE ' + String.join(whereClauses, ' AND '));


// Total count for client pagination
String countSql = 'SELECT COUNT() FROM Account' + whereSql;
Integer totalCount = (Integer)Database.countQuery(countSql, binds);


// Query page
Integer offsetVal = (pn - 1) * ps;
// Note: OFFSET beyond 2000 is not supported; client should use search terms to narrow.
String soql = 'SELECT Id, Name, Industry, Rating, AnnualRevenue, Phone, Website, OwnerId, BillingCity, BillingState '
+ 'FROM Account' + whereSql
+ ' ORDER BY Name NULLS LAST'
+ ' LIMIT :ps OFFSET :offsetVal';


List<Account> recs = Database.queryWithBinds(soql, binds);


// Enforce FLS for READ
SObjectAccessDecision readDecision = Security.stripInaccessible(
AccessType.READABLE,
recs
);
List<Account> safe = (List<Account>)readDecision.getRecords();


SearchResult result = new SearchResult();
result.records = safe;
result.total = totalCount;
result.pageNumber = pn;
result.pageSize = ps;
return result;
}


@AuraEnabled(cacheable=true)
public static RelatedResult getRelated(
Id accountId,
Integer contactPage,
Integer oppPage,
Integer pageSize,
Boolean openOnly
) {
if (accountId == null) {
throw new AuraHandledException('accountId is required');
}
}
