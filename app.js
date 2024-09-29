// Prevent default double-click behavior
document.addEventListener('dblclick', (event) => event.preventDefault());

// Normalize artist names for consistent search (e.g., "The Beatles" -> "Beatles, The")
function normalizeArtist(artist) {
  const theMatch = artist.match(/^The\s(.+)/i);
  return theMatch ? `${theMatch[1]}, The` : artist;
}

// Load and process song data
fetch('songs.json')
  .then(response => response.json())
  .then(data => {
    const songs = processData(data);
    setupSearch(songs);
    setupAlphabetBrowse(data);
  })
  .catch(error => console.error('Error loading JSON:', error));

// Process data into a searchable format
function processData(data) {
  return Object.entries(data).flatMap(([artist, titles]) =>
    titles.map(title => ({
      artist: normalizeArtist(artist),
      title,
      combined: `${normalizeArtist(artist)} ${title}`.toLowerCase()
    }))
  );
}

// Set up Fuse.js search functionality
function setupSearch(songs) {
  const options = {
    keys: ['combined'],
    threshold: 0.33,
    ignoreLocation: true,
    includeScore: true,
  };
  const fuse = new Fuse(songs, options);
  const searchInput = document.getElementById('searchInput');
  const resultsList = document.getElementById('resultsList');

  // Debounce function to limit the frequency of search execution
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Handle search button click
  document.getElementById('searchButton').addEventListener('click', () => {
    const query = searchInput.value.trim();
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    resultsList.innerHTML = '';

    if (!tokens.length) return;

    const scoreMap = new Map();

    tokens.forEach(token => {
      fuse.search(token).forEach(({ item, score }) => {
        const entry = scoreMap.get(item) || { totalScore: 0, count: 0 };
        scoreMap.set(item, {
          totalScore: entry.totalScore + score,
          count: entry.count + 1,
        });
      });
    });

    const results = Array.from(scoreMap.entries())
    .filter(([_, data]) => data.count >= Math.ceil(tokens.length * 0.8)) // Require at least 80% match
    .map(([item, data]) => ({ item, averageScore: data.totalScore / data.count }))
    .sort((a, b) => a.averageScore - b.averageScore);

    displayResults(results);
  });

  // Display search results
  function displayResults(results) {
    const maxResults = 100;
    const resultsToDisplay = results.slice(0, maxResults);

    if (resultsToDisplay.length) {
      resultsToDisplay.forEach(({ item }) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(item.artist + ' ' + item.title)}`;
        a.target = '_blank';
        a.textContent = `${item.artist} - ${item.title}`;
        li.appendChild(a);
        resultsList.appendChild(li);
      });
      if (results.length > maxResults) {
        const li = document.createElement('li');
        li.textContent = `And ${results.length - maxResults} more...`;
        resultsList.appendChild(li);
      }
    } else {
      const li = document.createElement('li');
      li.textContent = 'No results found';
      resultsList.appendChild(li);
    }
  }

  // Handle "Feeling Lucky" button
  document.getElementById('feelingLuckyButton').addEventListener('click', () => {
    const randomSongs = [...songs].sort(() => 0.5 - Math.random()).slice(0, 3);
    resultsList.innerHTML = '';
    randomSongs.forEach(song => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(song.artist + ' ' + song.title)}`;
      a.target = '_blank';
      a.textContent = `${song.artist} - ${song.title}`;
      li.appendChild(a);
      resultsList.appendChild(li);
    });
  });
}

// Set up alphabet-based browsing functionality
function setupAlphabetBrowse(data) {
  const alphabet = '+0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const alphabetDropdown = document.getElementById('alphabetDropdown');
  const artistList = document.getElementById('artistList');
  const songList = document.getElementById('songList');
  const closeSongList = document.getElementById('closeSongList');
  const songListHeader = document.getElementById('songListHeader');
  const artistNameElem = document.getElementById('artistName');
  const paginationControls = document.getElementById('paginationControls');
  const itemsPerPage = getColumnCount() * 7;
  let currentPage = 1;

  alphabet.forEach(letter => {
    const option = document.createElement('option');
    option.value = letter;
    option.textContent = letter;
    alphabetDropdown.appendChild(option);
  });

  alphabetDropdown.addEventListener('change', (event) => {
    currentPage = 1;
    displayArtistsByLetter(event.target.value);
  });

  alphabetDropdown.value = 'A';
  displayArtistsByLetter('A');

  // Display artists based on selected letter
  function displayArtistsByLetter(letter) {
    artistList.innerHTML = '';
    songList.innerHTML = '';
    songListHeader.style.display = 'none';
    paginationControls.style.display = 'block';
    artistList.style.display = 'block';

    const artists = Object.keys(data).filter(artist => normalizeArtist(artist)[0].toUpperCase() === letter);
    if (!artists.length) {
      artistList.innerHTML = `<div class="no-artists">No artists found under ${letter}</div>`;
      return;
    }

    const totalPages = Math.ceil(artists.length / itemsPerPage);
    displayArtists(artists);
    createPaginationControls(totalPages, artists);
  }

  // Create pagination controls
  function createPaginationControls(totalPages, artists) {
    paginationControls.innerHTML = '';

    const prevButton = createPaginationButton('Previous', () => {
      if (currentPage > 1) {
        currentPage--;
        displayArtists(artists);
        updatePaginationStatus(totalPages);
      }
    });
    paginationControls.appendChild(prevButton);

    const currentPageElem = document.createElement('span');
    currentPageElem.id = 'current-page';
    currentPageElem.textContent = `Page ${currentPage} of ${totalPages}`;
    paginationControls.appendChild(currentPageElem);

    const nextButton = createPaginationButton('Next', () => {
      if (currentPage < totalPages) {
        currentPage++;
        displayArtists(artists);
        updatePaginationStatus(totalPages);
      }
    });
    paginationControls.appendChild(nextButton);
  }

  // Helper to create pagination buttons
  function createPaginationButton(text, onClick) {
    const button = document.createElement('button');
    button.classList.add('pagination-button');
    button.id = 'pagination-button-' + text.toLowerCase();
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  }

  // Update pagination status
  function updatePaginationStatus(totalPages) {
    document.getElementById('current-page').textContent = `Page ${currentPage} of ${totalPages}`;
  }

  // Display artists based on the current page
  function displayArtists(artists) {
    artistList.innerHTML = '';
    const artistsToShow = artists.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const columnWrapper = document.createElement('div');
    columnWrapper.classList.add('artist-column-wrapper');
    columnWrapper.style.display = 'grid';
    columnWrapper.style.gridTemplateColumns = `repeat(${getColumnCount()}, 1fr)`;
    columnWrapper.style.gap = '5px';

    artistsToShow.forEach(artist => {
      const artistItem = document.createElement('div');
      artistItem.classList.add('artist-item');
      artistItem.textContent = normalizeArtist(artist);
      artistItem.style.cursor = 'pointer';
      artistItem.addEventListener('click', () => displaySongsByArtist(normalizeArtist(artist), data[artist]));
      columnWrapper.appendChild(artistItem);
    });

    artistList.appendChild(columnWrapper);
  }

  // Close song list
  closeSongList.addEventListener('click', () => {
    songList.style.display = 'none';
    songListHeader.style.display = 'none';
    artistList.style.display = 'block';
    paginationControls.style.display = 'block';
  });

  // Display songs for the selected artist
  function displaySongsByArtist(artist, songs) {
    songList.innerHTML = '';
    artistNameElem.textContent = artist;
    songListHeader.style.display = 'block';
    songList.style.display = 'block';
    paginationControls.style.display = 'none';
    artistList.style.display = 'none';

    songs.forEach(song => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${song}`)}`;
      a.target = '_blank';
      a.textContent = song;
      li.appendChild(a);
      songList.appendChild(li);
    });
  }

  // Dynamically adjust column count based on window width
  function getColumnCount() {
    const windowWidth = window.innerWidth;
    if (windowWidth >= 1200) return 4;
    if (windowWidth >= 800) return 3;
    return 2;
  }

  window.addEventListener('resize', () => {
    const currentLetter = alphabetDropdown.value;
    displayArtistsByLetter(currentLetter);
  });
}
