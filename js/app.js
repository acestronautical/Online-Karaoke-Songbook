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
    threshold: 0.4, // Adjust sensitivity (lower is stricter, higher allows more partial matches)
    distance: 100,  // Allow partial matches across words
    includeScore: true, // Include scores to fine-tune results if needed
  };
  const fuse = new Fuse(songs, options);

  // Handle search input
  const searchInput = document.getElementById('searchInput');
  const resultsList = document.getElementById('resultsList');

  searchInput.addEventListener('input', () => {
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
  });
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

  // Create alphabet navigation
  alphabet.forEach(letter => {
    const li = document.createElement('li');
    li.textContent = letter;
    li.style.cursor = 'pointer'; // Make the letters clickable
    li.addEventListener('click', () => {
      displayArtistsByLetter(letter);
    });
    alphabetList.appendChild(li);
  });

  // Display artists when a letter is clicked
  function displayArtistsByLetter(letter) {
    artistList.innerHTML = ''; // Clear any previous artists
    letterElem.textContent = letter; // Update the letter in the header
    artistListHeader.style.display = 'block'; // Show the artist list header
    songList.innerHTML = ''; // Clear any previous song lists
    songListHeader.style.display = 'none'; // Hide the song list header

    // Filter and display artists starting with the selected letter
    const artists = Object.keys(data).filter(artist => normalizeArtist(artist)[0].toUpperCase() === letter);

    if (artists.length === 0) {
      artistList.innerHTML = `<li>No artists found under ${letter}</li>`;
      return;
    }

    artists.forEach(artist => {
      const normalizedArtist = normalizeArtist(artist);
      const li = document.createElement('li');
      li.textContent = normalizedArtist;
      li.addEventListener('click', () => {
        displaySongsByArtist(normalizedArtist, data[artist]);
      });
      artistList.appendChild(li);
    });
  }

  // Display songs when an artist is clicked
  function displaySongsByArtist(artist, songs) {
    songList.innerHTML = ''; // Clear any previous songs
    artistNameElem.textContent = artist; // Update artist name in the header
    songListHeader.style.display = 'block'; // Show the song list header

    // Populate the song list
    songs.forEach(song => {
      const li = document.createElement('li');
      li.textContent = song;
      songList.appendChild(li);
    });
  }
}
