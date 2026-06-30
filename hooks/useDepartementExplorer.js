import { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { departements, getDepartementByCode } from '../data/departementCatalog';
import { filterDepartements } from '../utils/departementSearch';
import { pickRandomDepartement } from '../utils/randomDepartement';

const pickRandom = (current) => pickRandomDepartement(departements, current);

export function useDepartementExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOverlayVisible, setSearchOverlayVisible] = useState(false);
  const [selectedDepartement, setSelectedDepartement] = useState(() =>
    pickRandom(null)
  );
  const [zoomedCode, setZoomedCode] = useState(null);
  const [showFullList, setShowFullList] = useState(false);

  const isSearchEmpty = !searchQuery.trim();
  const isDetailView = zoomedCode != null;

  const filteredDepartements = useMemo(
    () => filterDepartements(departements, searchQuery),
    [searchQuery]
  );

  const mapHighlightedCodes = useMemo(() => {
    if (!isSearchEmpty) {
      return filteredDepartements.map((dept) => dept.number);
    }
    return [];
  }, [filteredDepartements, isSearchEmpty]);

  const closeSearchOverlay = useCallback(() => {
    Keyboard.dismiss();
    setSearchOverlayVisible(false);
  }, []);

  const openSearchOverlay = useCallback(() => {
    setSearchOverlayVisible(true);
  }, []);

  const openSearchWithFullList = useCallback(() => {
    setShowFullList(true);
    setSearchOverlayVisible(true);
  }, []);

  const handleDepartementPress = useCallback(
    (departement) => {
      Keyboard.dismiss();
      setSelectedDepartement(departement);
      setSearchOverlayVisible(false);
      if (isDetailView) {
        setZoomedCode(departement.number);
      }
    },
    [isDetailView]
  );

  const handleMapZoomChange = useCallback((zoomed) => {
    if (!zoomed) {
      setZoomedCode(null);
    }
  }, []);

  const handleDetailStripPress = useCallback(() => {
    if (!selectedDepartement) {
      return;
    }
    if (isDetailView) {
      setZoomedCode(null);
    } else {
      setZoomedCode(selectedDepartement.number);
    }
  }, [isDetailView, selectedDepartement]);

  const handleDetailClose = useCallback(() => {
    Keyboard.dismiss();
    setZoomedCode(null);
    setSelectedDepartement(null);
    setSearchQuery('');
    setShowFullList(false);
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setShowFullList(false);
      Keyboard.dismiss();
    }
  }, []);

  const handleListToggle = useCallback(() => {
    Keyboard.dismiss();
    setShowFullList((prev) => !prev);
  }, []);

  const handleMapDepartmentPress = useCallback(
    (code) => {
      Keyboard.dismiss();
      setSearchOverlayVisible(false);
      const departement = getDepartementByCode(code);
      if (!departement) {
        return;
      }
      setSelectedDepartement(departement);
      if (isDetailView) {
        setZoomedCode(code);
      }
    },
    [isDetailView]
  );

  const handleRandomRefresh = useCallback(() => {
    Keyboard.dismiss();
    setSearchOverlayVisible(false);
    setSelectedDepartement((current) => {
      const next = pickRandom(current);
      setZoomedCode((zoomed) => (zoomed != null ? next.number : zoomed));
      return next;
    });
  }, []);

  const handleGoToDepartementCode = useCallback(
    (code) => {
      const departement = getDepartementByCode(code);
      if (!departement) {
        return;
      }

      Keyboard.dismiss();
      setSearchOverlayVisible(false);
      setSelectedDepartement(departement);
      if (isDetailView) {
        setZoomedCode(departement.number);
      }
    },
    [isDetailView]
  );

  return {
    searchQuery,
    searchOverlayVisible,
    selectedDepartement,
    zoomedCode,
    isSearchEmpty,
    isDetailView,
    showFullList,
    filteredDepartements,
    mapHighlightedCodes,
    openSearchOverlay,
    openSearchWithFullList,
    closeSearchOverlay,
    handleDepartementPress,
    handleMapZoomChange,
    handleDetailStripPress,
    handleDetailClose,
    handleSearchChange,
    handleListToggle,
    handleMapDepartmentPress,
    handleRandomRefresh,
    handleGoToDepartementCode,
  };
}
