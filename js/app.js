// Load the song data
fetch('data/songs.json')
  .then(response => response.json())
  .then(data => {
    setupSearch(data);
    setupAlphabetBrowse(data);
  })
  .catch(error => console.error('Error loading JSON:', error));

// Normalize artist names for searching (e.g., "The Beatles" -> "Beatles, The")
function normalizeArtist(artist) {
  const theMatch = artist.match(/^The\s(.+)/i);
  return theMatch ? `${theMatch[1]}, The` : artist;
}

// Set up Fuse.js search
function setupSearch(data) {
  const songs = [];

  // Convert the data into a searchable array, normalizing artist names
  for (const artist in data) {
    const normalizedArtist = normalizeArtist(artist); // Normalize artist
    data[artist].forEach(title => {
      songs.push({
        artist: normalizedArtist,
        title: title,
        combined: `${normalizedArtist} ${title}` // Combined field for better search
      });
    });
  }

  // Initialize Fuse.js with improved search options
  const options = {
    keys: ['artist', 'title', 'combined'], // Search by artist, title, and combined fields
    threshold: 0.2, // Adjust sensitivity (lower is stricter, higher allows more partial matches)
    distance: 100,  // Allow partial matches across words
    includeScore: true, // Include scores to fine-tune results if needed
  };
  const fuse = new Fuse(songs, options);

  // Handle search input
  const searchInput = document.getElementById('searchInput');
  const resultsList = document.getElementById('resultsList');

  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  searchInput.addEventListener('input', debounce(() => {
    const query = searchInput.value.trim().toLowerCase();
    const results = fuse.search(query);

    // Clear previous results
    resultsList.innerHTML = '';

    // Display new results
    if (query !== '') {
      results.forEach(result => {
        const li = document.createElement('li');
        li.textContent = `${result.item.artist} - ${result.item.title}`;
        resultsList.appendChild(li);
      });

      // Handle no results
      if (results.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No results found';
        resultsList.appendChild(li);
      }
    }
  }, 1500));
}

// Set up alphabet browse functionality
function setupAlphabetBrowse(data) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const alphabetList = document.getElementById('alphabetList');
  const artistList = document.getElementById('artistList');
  const artistListHeader = document.getElementById('artistListHeader');
  const songList = document.getElementById('songList');
  const songListHeader = document.getElementById('songListHeader');
  const artistNameElem = document.getElementById('artistName');
  const letterElem = document.getElementById('letter');

  const itemsPerPage = 35; // Number of artists to display per page
  let currentPage = 1; // Track the current page

  // Create alphabet navigation
  alphabet.forEach(letter => {
    const li = document.createElement('li');
    li.classList.add('alphabet-letter'); // Added class for styling
    li.textContent = letter;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      currentPage = 1; // Reset to first page when a new letter is clicked
      displayArtistsByLetter(letter);
    });
    alphabetList.appendChild(li);
  });

  // Display artists when a letter is clicked
  function displayArtistsByLetter(letter) {
    artistList.innerHTML = ''; // Clear previous artists
    letterElem.textContent = letter; // Update the letter in the header
    artistListHeader.style.display = 'block'; // Show the artist list header
    songList.innerHTML = ''; // Clear previous song lists
    songListHeader.style.display = 'none'; // Hide the song list header
    document.getElementById('paginationControls').style.display = 'block';
    artistList.style.display = 'block';
    artistListHeader.style.display = 'block';
    // Filter and display artists starting with the selected letter
    const artists = Object.keys(data).filter(artist => normalizeArtist(artist)[0].toUpperCase() === letter);

    if (artists.length === 0) {
      artistList.innerHTML = `<div class="no-artists">No artists found under ${letter}</div>`;
      return;
    }

    const totalPages = Math.ceil(artists.length / itemsPerPage);
    displayArtists(artists);
    createPaginationControls(totalPages, artists);
  }

  // Create pagination controls
function createPaginationControls(totalPages, artists) {
  const paginationControls = document.getElementById('paginationControls');
  paginationControls.innerHTML = ''; // Clear previous controls

  // Previous button
  const prevButton = document.createElement('button');
  prevButton.classList.add('pagination-button');
  prevButton.textContent = 'Previous';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
          currentPage--; // Update the current page
          displayArtists(artists); // Refresh the artist display
          updateCurrentPageDisplay(currentPage, totalPages);
          prevButton.disabled = currentPage === 1; // Disable if on first page
          nextButton.disabled = currentPage === totalPages; // Enable/disable next button
      }
  });
  paginationControls.appendChild(prevButton);

  // Current page
  const currentPageElem = document.createElement('span');
  currentPageElem.id = 'currentPage';
  currentPageElem.textContent = `Page ${currentPage} of ${totalPages}`;
  paginationControls.appendChild(currentPageElem);

  // Next button
  const nextButton = document.createElement('button');
  nextButton.classList.add('pagination-button');
  nextButton.textContent = 'Next';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
          currentPage++; // Update the current page
          displayArtists(artists); // Refresh the artist display
          updateCurrentPageDisplay(currentPage, totalPages);
          prevButton.disabled = currentPage === 1; // Enable/disable previous button
          nextButton.disabled = currentPage === totalPages; // Enable/disable next button
      }
  });
  paginationControls.appendChild(nextButton);
}


  // Function to update current page display
  function updateCurrentPageDisplay(currentPage, totalPages) {
    const currentPageElem = document.getElementById('currentPage');
    currentPageElem.textContent = `Page ${currentPage} of ${totalPages}`;
  }

// Function to get the column count based on screen width
function getColumnCount() {
  const width = window.innerWidth;
  if (width <= 768) { // Adjust the breakpoint as needed for mobile
    return 2; // Use 2 columns on mobile
  } else {
    return 5; // Use 5 columns on larger screens
  }
}
  // Function to display artists based on the current page in a multi-column layout
  function displayArtists(artists) {
    artistList.innerHTML = ''; // Clear any previous artists
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, artists.length);
    const artistsToShow = artists.slice(startIndex, endIndex);

    const columnCount = getColumnCount(); // Number of columns
    const columnWrapper = document.createElement('div');
    columnWrapper.classList.add('artist-column-wrapper'); // Added class for styling
    columnWrapper.style.display = 'grid';
    columnWrapper.style.gridTemplateColumns = `repeat(${columnCount}, 1fr)`;
    columnWrapper.style.gap = '10px'; // Gap between columns

    artistsToShow.forEach(artist => {
      const normalizedArtist = normalizeArtist(artist);
      const artistItem = document.createElement('div');
      artistItem.classList.add('artist-item'); // Added class for styling
      artistItem.textContent = normalizedArtist;
      artistItem.style.cursor = 'pointer';
      artistItem.addEventListener('click', () => {
        displaySongsByArtist(normalizedArtist, data[artist]);
      });
      columnWrapper.appendChild(artistItem);
    });

    artistList.appendChild(columnWrapper); // Add the column layout to the artist list
  }

  // Display songs when an artist is clicked
  function displaySongsByArtist(artist, songs) {
    songList.innerHTML = ''; // Clear previous songs
    artistNameElem.textContent = artist; // Update artist name in the header
    songListHeader.style.display = 'block'; // Show the song list header

    // Hide the artist list
    document.getElementById('paginationControls').style.display = 'none';

    artistList.style.display = 'none';
    artistListHeader.style.display = 'none';

    // Populate the song list
    songs.forEach(song => {
      const li = document.createElement('li');
      li.classList.add('song-item'); // Added class for styling
      li.textContent = song;
      songList.appendChild(li);
    });

    // Update current page display
  }

}
