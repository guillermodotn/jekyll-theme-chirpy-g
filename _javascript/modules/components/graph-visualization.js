import { select, zoom, drag, forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, zoomIdentity } from 'd3';

const d3 = {
  select,
  zoom,
  drag,
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  zoomIdentity
};

const nodes = [];
const links = [];
const tags = new Set();
const tagCounts = {};
const postsData = {};

// Fetch the JSON graph data
function loadGraphData() {
    fetch('/assets/js/data/graph.json')
    .then(response => response.json())
    .then(data => {
        data.posts.forEach(post => {
            postsData[post.id] = { tags: post.tags, date: post.date, url: post.url };
            nodes.push({ id: post.id, type: 'post', url: post.url, tags: post.tags, date: post.date });
            post.tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                if (!tags.has(tag)) {
                    nodes.push({ id: tag, type: 'tag', count: 0 });
                    tags.add(tag);
                }
                links.push({ source: post.id, target: tag, label: tag });
            });
        });
        nodes.forEach(n => {
            if (n.type === 'tag') {
                n.count = tagCounts[n.id] || 0;
            }
        });
        initializeGraph();
    })
    .catch(error => console.error('Error loading JSON:', error));
}

// Initialize the graph (D3 code)
function initializeGraph() {
  // Set up SVG and simulation
  const svg = d3.select('svg');
  const width = svg.node().getBoundingClientRect().width;
  const height = svg.node().getBoundingClientRect().height;

  const zoomBehavior = d3.zoom()
    .scaleExtent([0.3, 5]) // Set zoom-out and zoom-in limits
    .on('zoom', (event) => {
      container.attr('transform', event.transform); // Apply zoom transform
    });

  svg.call(zoomBehavior);

  const container = svg.append('g');

  // Create a force simulation to position the nodes
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(70))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(d => d.type === 'post' ? 15 : 9))
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05));

  // Create link elements
  const link = container.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter().append('line')
    .attr('class', 'link');

  // Create node groups (each contains circle + label)
  const nodeGroup = container.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'node-group')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  const tooltip = d3.select('#graph-tooltip');

  // Add circles to each group
  nodeGroup.append('circle')
    .attr('class', d => d.type === 'post' ? 'post-node' : 'tag-node')
    .attr('r', d => d.type === 'post' ? 8 : 4)
    .on('click', (event, d) => {
      if (d.type === 'post' && d.url) {
        window.location.href = d.url;
      } else if (d.type === 'tag') {
        window.location.href = generateTagUrl(d.id);
      }
    })
    .on('mouseover', function(event, d) {
      const connectedIds = new Set();
      connectedIds.add(d.id);

      links.forEach(l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sourceId === d.id) connectedIds.add(targetId);
        if (targetId === d.id) connectedIds.add(sourceId);
      });

      nodeGroup.classed('dimmed', n => !connectedIds.has(n.id));
      link.classed('dimmed', l => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        return sourceId !== d.id && targetId !== d.id;
      });

      tooltip
        .style('opacity', 1)
        .html(d.type === 'post'
          ? `<strong>${d.id}</strong><br><span class="tooltip-date">${d.date || ''}</span><br><span class="tooltip-tags">${d.tags ? d.tags.join(', ') : ''}</span><br><span class="tooltip-hint">Click to view</span>`
          : `<strong>${d.id}</strong><br><span class="tooltip-count">${d.count} post${d.count !== 1 ? 's' : ''}</span>`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => {
      nodeGroup.classed('dimmed', false);
      link.classed('dimmed', false);
      tooltip.style('opacity', 0);
    });

  // Add labels to each group
  nodeGroup.append('text')
    .attr('class', d => d.type === 'post' ? 'post-label' : 'tag-label')
    .attr('dy', '-12px')
    .text(d => d.id);

  // Update positions on each simulation tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeGroup
      .attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Drag event handlers
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Update the fitGraphToContainer function to accept new dimensions
  function fitGraphToContainer(width, height) {
    const bounds = container.node().getBBox();
    const w = bounds.width;
    const h = bounds.height;
    const midX = bounds.x + w / 2;
    const midY = bounds.y + h / 2;

    if (w === 0 || h === 0) return; // Avoid division by zero

    // Calculate scale to fit the graph into view
    const scale = 0.9 / Math.max(w / width, h / height);
    const transform = d3.zoomIdentity
      .translate(width / 2 - scale * midX, height / 2 - scale * midY)
      .scale(scale);

    svg.transition().duration(500).call(zoomBehavior.transform, transform);
  }

  // Run the fit function once the simulation settles
  simulation.on('end', () => {
    fitGraphToContainer(width, height);
  });

  // Recenter the graph in smaller screens
  window.addEventListener('resize', () => {
    const newWidth = svg.node().getBoundingClientRect().width;
    const newHeight = svg.node().getBoundingClientRect().height;
    
    // Update the force simulation center to the new size
    simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));

    // Adjust zoom settings after resize
    svg.transition().duration(500).call(zoomBehavior.transform, zoomIdentity.translate(newWidth / 2, newHeight / 2).scale(1));
    
    // Fit the graph to the new size
    fitGraphToContainer(newWidth, newHeight);
  });

  // Ensure touch events for drag work on mobile devices
  svg.on('touchstart', function(event) {
    event.preventDefault(); // Prevent default to avoid zoom issues
  });
}

// Sluggify function
function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD') // Remove accents
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}

// URL encode function
function urlEncode(str) {
  return encodeURIComponent(str);
}

// Process the tag (slugify, URL encode, and build the final URL)
function generateTagUrl(tag) {
  const sluggedTag = slugify(tag);
  const encodedTag = urlEncode(sluggedTag);
  const url = `/tags/${encodedTag}/`; // Prepend and append paths
  return url;
}

export { loadGraphData as graphInit };