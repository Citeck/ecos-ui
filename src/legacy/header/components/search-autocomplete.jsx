import React from 'react';
import { connect } from 'react-redux';
import { t } from '../../common/util';
import SearchAutocompleteItem, {
  SEARCH_AUTOCOMPLETE_TYPE_DOCUMENTS,
  SEARCH_AUTOCOMPLETE_TYPE_SITES,
  SEARCH_AUTOCOMPLETE_TYPE_PEOPLE
} from './search-autocomplete-item';

const mapStateToProps = state => ({
  isVisible: state.search.autocomplete.isVisible,
  documents: state.search.autocomplete.documents,
  sites: state.search.autocomplete.sites,
  people: state.search.autocomplete.people
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
        <a href="#" onClick={fetchMoreDocuments}>
          {t('search.more')}
        </a>
      </p>
    ) : null;

    documentsSection = (
      <section className="autocomplete-section">
        <h4 className="autocomplete-section__h">{t('search.documents')}</h4>
        <ul className="autocomplete-section__list">
          {documents.items.map(item => (
            <SearchAutocompleteItem item={item} type={SEARCH_AUTOCOMPLETE_TYPE_DOCUMENTS} />
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
            <SearchAutocompleteItem item={item} type={SEARCH_AUTOCOMPLETE_TYPE_SITES} />
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
            <SearchAutocompleteItem item={item} type={SEARCH_AUTOCOMPLETE_TYPE_PEOPLE} />
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
