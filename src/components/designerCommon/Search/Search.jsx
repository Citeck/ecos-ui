import React, { useState, useEffect, useCallback, useRef } from 'react';
import { t } from '../../../helpers/util';
import { SEARCH_MIN_LENGTH } from '../../../constants/bpmn';
import styles from './Search.module.scss';

const Search = ({ searchText, setSearchText }) => {
  const [inputValue, setInputValue] = useState(searchText || '');
  const [showHint, setShowHint] = useState(false);
  const hintTimeoutRef = useRef(null);

  const debouncedSetSearchText = useCallback(
    (() => {
      let timeoutId;
      return (value) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setSearchText({ target: { value } });
        }, 400);
      };
    })(),
    [setSearchText]
  );

  const debouncedShowHint = useCallback((shouldShow) => {
    clearTimeout(hintTimeoutRef.current);

    if (shouldShow) {
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(true);
      }, 600);
    } else {
      setShowHint(false);
    }
  }, []);

  useEffect(() => {
    if (searchText !== inputValue) {
      setInputValue(searchText || '');
    }
  }, [searchText]);

  useEffect(() => {
    return () => {
      clearTimeout(hintTimeoutRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const shouldShowHint = value.trim().length === SEARCH_MIN_LENGTH - 1;
    debouncedShowHint(shouldShowHint);

    debouncedSetSearchText(value);
  };

  const handleFocus = () => {
    if (inputValue.trim().length === SEARCH_MIN_LENGTH - 1) {
      debouncedShowHint(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      clearTimeout(hintTimeoutRef.current);
      setShowHint(false);
    }, 150);
  };

  return (
    <div className={styles.search}>
      <label className="icon-search">
        <input
          type="text"
          placeholder={t('bpmn-designer.process-models.find')}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </label>
      {showHint && (
        <div className={styles.searchHint}>
          {t('designer.search.min-chars-hint')}
        </div>
      )}
    </div>
  );
};

export default Search;
