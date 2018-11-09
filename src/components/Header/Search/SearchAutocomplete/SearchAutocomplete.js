import React from 'react';
import { connect } from 'react-redux';
import { t } from '../../../../misc/util';
import SearchAutocompleteItem, {
  SEARCH_AUTOCOMPLETE_TYPE_DOCUMENTS,
  SEARCH_AUTOCOMPLETE_TYPE_SITES,
  SEARCH_AUTOCOMPLETE_TYPE_PEOPLE
} from '../SearchAutocompleteItem';

const mapStateToProps = state => ({
  isVisible: state.header.search.autocomplete.isVisible,
  documents: state.header.search.autocomplete.documents,
  sites: state.header.search.autocomplete.sites,
  people: state.header.search.autocomplete.people
});

const SearchAutocomplete = ({ isVisible, documents, sites, people, fetchMoreDocuments }) => {
  const totalResults = documents.items.length + sites.items.length + people.items.length;
  if (totalResults < 1 || !isVisible) {
    return null;
  }

  let documentsSection = null;
  if (documents.items.length > 0) {
    const moreButtom = documents.hasMoreRecords ? (
      <p className="autocomplete-section__more">
        <span onClick={fetchMoreDocuments}>{t('search.more')}</span>
      </p>
    ) : null;

    documentsSection = (
      <section className="autocomplete-section">
        <h4 className="autocomplete-section__h">{t('search.documents')}</h4>
        <ul className="autocomplete-section__list">
          {documents.items.map(item => (
            <SearchAutocompleteItem key={item.nodeRef} item={item} type={SEARCH_AUTOCOMPLETE_TYPE_DOCUMENTS} />
          ))}
        </ul>
        {moreButtom}
      </section>
    );
  }

  let sitesSection = null;
  if (sites.items.length > 0) {
    sitesSection = (
      <section className="autocomplete-section">
        <h4 className="autocomplete-section__h">{t('search.sites')}</h4>
        <ul className="autocomplete-section__list">
          {sites.items.map(item => (
            <SearchAutocompleteItem key={item.shortName} item={item} type={SEARCH_AUTOCOMPLETE_TYPE_SITES} />
          ))}
        </ul>
      </section>
    );
  }

  let peopleSection = null;
  if (people.items.length > 0) {
    peopleSection = (
      <section className="autocomplete-section">
        <h4 className="autocomplete-section__h">{t('search.people')}</h4>
        <ul className="autocomplete-section__list">
          {people.items.map(item => (
            <SearchAutocompleteItem key={item.userName} item={item} type={SEARCH_AUTOCOMPLETE_TYPE_PEOPLE} />
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="share-header-search__autocomplete">
      {documentsSection}
      {sitesSection}
      {peopleSection}
    </div>
  );
};

export default connect(mapStateToProps)(SearchAutocomplete);
