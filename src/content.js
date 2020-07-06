/* The script 
1. Parses DOI or PMCID from the URL strings associated with the article titles. 
2. Parses article titles.
3. Fetches PMID number from NCBI E-utilities (eSearch) using DOI, PMCID, or article title. 
4. Displays PMID number and link to PubMed on the webpage.*/

// Highlight icon.
chrome.runtime.sendMessage({todo: 'showPageAction'});


// E-utilities API key.
const eutilsApiKey = 'YourApiKey';
// E-utilities eSearch base URL specifying JSON format.
const esearchBaseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&api_key=' + eutilsApiKey + '&term=';
// PubMed base URL.
const pubmedBaseUrl = 'https://pubmed.ncbi.nlm.nih.gov/';


// Hostname to DOI map.
const hostnameDoiMap = {
	'www.nature.com/articles': '10.1038'
};

// Create RegExp object for PMCID.
const rePmcid = new RegExp('PMC[0-9]+|pmc[0-9]+');
// Create RegExp object for DOI.
const reDoi = new RegExp('10\\.[0-9]+/.*');


// Function that fetches PMID number from NCBI E-utilities (eSearch) by sending DOI or PMCID.
async function getPmidById(articleId) {
	const response = await fetch(esearchBaseUrl + articleId);
	return await response.json();
}

// Function that fetches PMID number from NCBI E-utilities (eSearch) by sending article title.
async function getPmidByTitle(articleTitle) {
	const response = await fetch(esearchBaseUrl + articleTitle + '&field=title');
	return await response.json();
}

// Function that creates ul element.
function createUlElement(pmid='') {
	let $ul = $('<ul></ul>'); 
	$ul.append('<li>PMID: ' + pmid + '</li>');	// Add PMID number.
	$ul.append('<li><a href=' + pubmedBaseUrl + pmid + ' target=_blank>PubMed</a></li>');	// Add PubMed link.
	
	return $ul;
}


// Loop through each article block using class name "div.gs_r.gs_or.gs_scl".
$('div.gs_r.gs_or.gs_scl').each(function() {
	// Find article url.
	let articleUrl = $(this).find($('h3.gs_rt a')).attr('href');
	// Find article title. Remove prefix like [HTML] or [CITATION] and remove any non-word-character.
	let articleTitle = $(this).find($('h3.gs_rt')).text().replace(/^\[.*\]/g, '').replace(/\W/g, ' ');
	let foundPmc;  // To hold PMCID.	
	let foundDoi;  // To hold DOI.	
	let pmidNumber;  // To hold PMID.
	let $articleLinksUl;  // To hold ul element.
	
	// Find PMCID and DOI in the article URL.
	// First check if there is a hyperlink attached to the article title.
	if (articleUrl) {
		// Convert hostname to DOI.
		for (property in hostnameDoiMap) {
			if (articleUrl.includes(property)) { 
				articleUrl = articleUrl.replace(property, hostnameDoiMap[property])
			}
		}
		// Find PMCID in the article URL.
		foundPmc = articleUrl.match(rePmcid); 
		// Find DOI in the article URL.
		foundDoi = articleUrl.match(reDoi);
	}
	
	// If PMCID or DOI is found in the URL, send request to E-utilities and obtain PMID number using PMCID or DOI.
	// If neither is found in the URL, send request to E-utilities and obtain PMID number using article title. 
	// Create a <ul> and <li> elements to hold PMID and link to PubMed.
	// Append <ul> to the article block (.gs_ri).
	if (foundPmc) {
		getPmidById(foundPmc).then(data => {
			// Check if there is only 1 matched PMID.
			if (data.esearchresult.idlist.length === 1) {
				pmidNumber = data.esearchresult.idlist[0];  // Parse PMID number.
				// Create ul element to hold PMID and article links.
				$articleLinksUl = createUlElement(pmidNumber);
			} else {
				// When PMCID is found but E-utilities has no or multiple matched PMID.
				$articleLinksUl = $('<ul></ul>').append('<li>No or multiple matched records</li>');
			}
			// Append <ul> element to the article block and add a class name 'by-id' to the element.
			$(this).find('.gs_ri').append($articleLinksUl.addClass('by-id'));
		}).catch(function(err) {
			alert(err);
		})
	} else if (foundDoi) {
		getPmidById(foundDoi).then(data => {
			// Check if there is only 1 matched PMID.
			if (data.esearchresult.idlist.length === 1) {
				pmidNumber = data.esearchresult.idlist[0];  // Parse PMID number.
				// Create ul element to hold PMID and article links.
				$articleLinksUl = createUlElement(pmidNumber);
			} else {	
				// When DOI is found but E-utilities has no or multiple matched PMID.
				$articleLinksUl = $('<ul></ul>').append('<li>No or multiple matched records</li>');	
			}
			// Append <ul> element to the article block and add a class name 'by-id' to the element.
			$(this).find('.gs_ri').append($articleLinksUl.addClass('by-id'));
		}).catch(function(err) {
			alert(err);
		})
	} else {
		getPmidByTitle(articleTitle).then(data => {
			// Check if there is only 1 matched PMID.
			if (data.esearchresult.idlist.length === 1) {
				pmidNumber = data.esearchresult.idlist[0];  // Parse PMID number.
				// Create ul element to hold PMID and article links.
				$articleLinksUl = createUlElement(pmidNumber);
			} else {	
				// When E-utilities has no or multiple matched PMID.
				$articleLinksUl = $('<ul></ul>').append('<li>No or multiple matched records</li>');
			}
			// Append <ul> element to the article block and add a class name 'by-title' to the element.
			$(this).find('.gs_ri').append($articleLinksUl.addClass('by-title'));
		}).catch(function(err) {
			alert(err);
		})
	}
}); 