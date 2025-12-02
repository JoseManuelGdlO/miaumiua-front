/**
 * Vehicle Routing Problem (VRP) Solver
 * 
 * This module compares route optimization for 1 vs 2 drivers using:
 * - Google Distance Matrix API for real travel times/distances
 * - Heuristic VRP solver (clustering + nearest neighbor)
 * 
 * The solver helps decide whether it's better to use 1 driver or 2 drivers
 * based on minimizing the maximum route time/distance.
 */

import { mapsService } from '../services/mapsService';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Location {
  /** Address string or coordinates */
  address?: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Optional label/identifier */
  label?: string;
}

export interface Route {
  /** Indices of stops in order (0 = depot) */
  stops: number[];
  /** Total distance in km */
  totalDistance: number;
  /** Total time in minutes */
  totalTime: number;
}

export interface VRPSolution {
  /** Routes per vehicle (index 0 = vehicle 1, index 1 = vehicle 2, etc.) */
  routes: Route[];
  /** Maximum route time across all vehicles (in minutes) */
  maxRouteTime: number;
  /** Maximum route distance across all vehicles (in km) */
  maxRouteDistance: number;
  /** Total time across all vehicles */
  totalTime: number;
  /** Total distance across all vehicles */
  totalDistance: number;
}

export interface ComparisonResult {
  /** Solution with 1 driver */
  oneDriver: VRPSolution;
  /** Solution with 2 drivers */
  twoDrivers: VRPSolution;
  /** Recommendation: "1 driver" or "2 drivers" */
  recommendation: '1 driver' | '2 drivers';
  /** Reason for recommendation */
  reason: string;
}

// ============================================================================
// Distance Matrix Builder
// ============================================================================

/**
 * Builds a distance/time cost matrix from Google Distance Matrix API
 * 
 * @param locations Array of locations (first is depot, rest are stops)
 * @returns Promise resolving to cost matrix [distance in km, time in minutes]
 *          matrix[i][j] = [distance, time] from location i to location j
 */
export async function buildCostMatrix(
  locations: Location[]
): Promise<{ distanceMatrix: number[][]; timeMatrix: number[][] }> {
  if (locations.length === 0) {
    throw new Error('At least one location (depot) is required');
  }

  // Convert locations to coordinates array
  const coordinates = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));

  try {
    // Call Google Distance Matrix API
    const response = await mapsService.calculateDistanceMatrix(coordinates, coordinates);

    if (!response.success || !response.data) {
      throw new Error('Failed to get distance matrix from API');
    }

    const n = locations.length;
    const distanceMatrix: number[][] = [];
    const timeMatrix: number[][] = [];

    // Build matrices (distance in km, time in minutes)
    for (let i = 0; i < n; i++) {
      distanceMatrix[i] = [];
      timeMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        const element = response.data.matrix[i][j];
        if (element.distance !== null && element.duration !== null) {
          distanceMatrix[i][j] = element.distance; // Already in km
          timeMatrix[i][j] = element.duration; // Already in minutes
        } else {
          // If API fails for this pair, use a large penalty
          distanceMatrix[i][j] = i === j ? 0 : Infinity;
          timeMatrix[i][j] = i === j ? 0 : Infinity;
        }
      }
    }

    return { distanceMatrix, timeMatrix };
  } catch (error) {
    console.error('Error building cost matrix:', error);
    throw new Error(`Failed to build cost matrix: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// VRP Solver (Heuristic: Clustering + Nearest Neighbor)
// ============================================================================

/**
 * Solves VRP using clustering and nearest neighbor heuristic
 * 
 * @param numVehicles Number of vehicles (1 or 2)
 * @param distanceMatrix Distance matrix (km)
 * @param timeMatrix Time matrix (minutes)
 * @param numStops Number of stops (excluding depot)
 * @returns VRPSolution with routes for each vehicle
 */
export function solveVRP(
  numVehicles: number,
  distanceMatrix: number[][],
  timeMatrix: number[][],
  numStops: number
): VRPSolution {
  if (numVehicles < 1 || numVehicles > 2) {
    throw new Error('Only 1 or 2 vehicles are supported');
  }

  if (numStops === 0) {
    return {
      routes: [],
      maxRouteTime: 0,
      maxRouteDistance: 0,
      totalTime: 0,
      totalDistance: 0,
    };
  }

  // Depot is at index 0, stops are at indices 1 to numStops
  const depotIndex = 0;
  const stopIndices = Array.from({ length: numStops }, (_, i) => i + 1);

  if (numVehicles === 1) {
    // Single vehicle: solve TSP from depot
    const route = solveTSPFromDepot(depotIndex, stopIndices, distanceMatrix, timeMatrix);
    return {
      routes: [route],
      maxRouteTime: route.totalTime,
      maxRouteDistance: route.totalDistance,
      totalTime: route.totalTime,
      totalDistance: route.totalDistance,
    };
  } else {
    // Two vehicles: cluster stops and solve TSP for each cluster
    const clusters = clusterStops(stopIndices, distanceMatrix, numVehicles);
    const routes: Route[] = [];

    for (const cluster of clusters) {
      if (cluster.length === 0) continue;
      const route = solveTSPFromDepot(depotIndex, cluster, distanceMatrix, timeMatrix);
      routes.push(route);
    }

    // If we have fewer clusters than vehicles, add empty routes
    while (routes.length < numVehicles) {
      routes.push({
        stops: [depotIndex],
        totalDistance: 0,
        totalTime: 0,
      });
    }

    const maxRouteTime = Math.max(...routes.map(r => r.totalTime));
    const maxRouteDistance = Math.max(...routes.map(r => r.totalDistance));
    const totalTime = routes.reduce((sum, r) => sum + r.totalTime, 0);
    const totalDistance = routes.reduce((sum, r) => sum + r.totalDistance, 0);

    return {
      routes,
      maxRouteTime,
      maxRouteDistance,
      totalTime,
      totalDistance,
    };
  }
}

/**
 * Solves Traveling Salesman Problem (TSP) starting from depot
 * Uses Nearest Neighbor heuristic
 */
function solveTSPFromDepot(
  depotIndex: number,
  stopIndices: number[],
  distanceMatrix: number[][],
  timeMatrix: number[][]
): Route {
  if (stopIndices.length === 0) {
    return {
      stops: [depotIndex],
      totalDistance: 0,
      totalTime: 0,
    };
  }

  const route: number[] = [depotIndex];
  const visited = new Set<number>([depotIndex]);
  let currentIndex = depotIndex;
  let totalDistance = 0;
  let totalTime = 0;

  // Nearest Neighbor: always go to closest unvisited stop
  const remainingStops = [...stopIndices];

  while (remainingStops.length > 0) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (const stopIndex of remainingStops) {
      if (distanceMatrix[currentIndex][stopIndex] < nearestDistance) {
        nearestDistance = distanceMatrix[currentIndex][stopIndex];
        nearestIndex = stopIndex;
      }
    }

    if (nearestIndex === -1) break;

    route.push(nearestIndex);
    visited.add(nearestIndex);
    totalDistance += distanceMatrix[currentIndex][nearestIndex];
    totalTime += timeMatrix[currentIndex][nearestIndex];
    currentIndex = nearestIndex;

    // Remove from remaining stops
    const index = remainingStops.indexOf(nearestIndex);
    if (index > -1) {
      remainingStops.splice(index, 1);
    }
  }

  // Return to depot
  if (currentIndex !== depotIndex) {
    route.push(depotIndex);
    totalDistance += distanceMatrix[currentIndex][depotIndex];
    totalTime += timeMatrix[currentIndex][depotIndex];
  }

  return {
    stops: route,
    totalDistance,
    totalTime,
  };
}

/**
 * Clusters stops into groups for multiple vehicles
 * Uses k-means-like clustering based on distance from depot
 */
function clusterStops(
  stopIndices: number[],
  distanceMatrix: number[][],
  numClusters: number
): number[][] {
  if (stopIndices.length === 0) {
    return [];
  }

  if (numClusters === 1) {
    return [stopIndices];
  }

  if (stopIndices.length <= numClusters) {
    // If we have fewer stops than clusters, assign one stop per cluster
    return stopIndices.map(stop => [stop]);
  }

  const depotIndex = 0;
  const clusters: number[][] = Array.from({ length: numClusters }, () => []);

  // Sort stops by distance from depot
  const stopsWithDistance = stopIndices.map(stop => ({
    index: stop,
    distance: distanceMatrix[depotIndex][stop],
  })).sort((a, b) => a.distance - b.distance);

  // Distribute stops evenly between clusters
  // Alternate assignment to balance load
  for (let i = 0; i < stopsWithDistance.length; i++) {
    const clusterIndex = i % numClusters;
    clusters[clusterIndex].push(stopsWithDistance[i].index);
  }

  // Optional: Improve clustering by swapping stops between clusters
  // For simplicity, we'll use the initial balanced distribution

  return clusters.filter(cluster => cluster.length > 0);
}

// ============================================================================
// Main Comparison Function
// ============================================================================

/**
 * Compares route optimization for 1 driver vs 2 drivers
 * 
 * @param locations Array of locations (first is depot, rest are stops)
 *                  Can be addresses (strings) or coordinates (lat/lng)
 * @returns Promise resolving to comparison result
 */
export async function compareOneVsTwoDrivers(
  locations: Location[]
): Promise<ComparisonResult> {
  if (locations.length < 2) {
    throw new Error('Need at least 1 depot + 1 stop');
  }

  // Validate that all locations have coordinates
  for (let i = 0; i < locations.length; i++) {
    if (typeof locations[i].lat !== 'number' || typeof locations[i].lng !== 'number') {
      throw new Error(`Location ${i} must have valid lat/lng coordinates`);
    }
  }

  const depot = locations[0];
  const stops = locations.slice(1);
  const numStops = stops.length;

  console.log(`Comparing 1 vs 2 drivers for ${numStops} stops...`);

  // Build cost matrix from Google Distance Matrix API
  console.log('Building distance/time matrix from Google Maps API...');
  const { distanceMatrix, timeMatrix } = await buildCostMatrix(locations);

  // Solve VRP with 1 vehicle
  console.log('Solving VRP with 1 driver...');
  const oneDriverSolution = solveVRP(1, distanceMatrix, timeMatrix, numStops);

  // Solve VRP with 2 vehicles
  console.log('Solving VRP with 2 drivers...');
  const twoDriversSolution = solveVRP(2, distanceMatrix, timeMatrix, numStops);

  // Compare solutions
  // Recommendation based on minimizing maximum route time
  // (We want to minimize the longest route to balance workload)
  let recommendation: '1 driver' | '2 drivers';
  let reason: string;

  if (oneDriverSolution.maxRouteTime <= twoDriversSolution.maxRouteTime) {
    recommendation = '1 driver';
    reason = `1 driver has lower maximum route time (${oneDriverSolution.maxRouteTime.toFixed(1)} min vs ${twoDriversSolution.maxRouteTime.toFixed(1)} min)`;
  } else {
    recommendation = '2 drivers';
    reason = `2 drivers have lower maximum route time (${twoDriversSolution.maxRouteTime.toFixed(1)} min vs ${oneDriverSolution.maxRouteTime.toFixed(1)} min)`;
  }

  return {
    oneDriver: oneDriverSolution,
    twoDrivers: twoDriversSolution,
    recommendation,
    reason,
  };
}

// ============================================================================
// Helper Functions for Display
// ============================================================================

/**
 * Formats a route for display
 */
export function formatRoute(
  route: Route,
  locations: Location[],
  vehicleNumber: number
): string {
  const stopLabels = route.stops
    .map((stopIndex, idx) => {
      const loc = locations[stopIndex];
      const label = loc.label || loc.address || `Stop ${stopIndex}`;
      return idx === 0 ? `[Depot: ${label}]` : `${idx}. ${label}`;
    })
    .join(' → ');

  return `Vehicle ${vehicleNumber}: ${stopLabels}\n` +
         `  Distance: ${route.totalDistance.toFixed(2)} km\n` +
         `  Time: ${route.totalTime.toFixed(1)} minutes`;
}

/**
 * Prints comparison results in a readable format
 */
export function printComparison(
  result: ComparisonResult,
  locations: Location[]
): void {
  console.log('\n' + '='.repeat(60));
  console.log('ROUTE OPTIMIZATION COMPARISON');
  console.log('='.repeat(60));

  console.log('\n--- 1 DRIVER SOLUTION ---');
  console.log(`Total Distance: ${result.oneDriver.totalDistance.toFixed(2)} km`);
  console.log(`Total Time: ${result.oneDriver.totalTime.toFixed(1)} minutes`);
  console.log(`Max Route Time: ${result.oneDriver.maxRouteTime.toFixed(1)} minutes`);
  if (result.oneDriver.routes.length > 0) {
    console.log('\nRoute:');
    console.log(formatRoute(result.oneDriver.routes[0], locations, 1));
  }

  console.log('\n--- 2 DRIVERS SOLUTION ---');
  console.log(`Total Distance: ${result.twoDrivers.totalDistance.toFixed(2)} km`);
  console.log(`Total Time: ${result.twoDrivers.totalTime.toFixed(1)} minutes`);
  console.log(`Max Route Time: ${result.twoDrivers.maxRouteTime.toFixed(1)} minutes`);
  console.log('\nRoutes:');
  result.twoDrivers.routes.forEach((route, idx) => {
    if (route.stops.length > 1) { // Only show non-empty routes
      console.log(formatRoute(route, locations, idx + 1));
    }
  });

  console.log('\n--- RECOMMENDATION ---');
  console.log(`✅ Use: ${result.recommendation.toUpperCase()}`);
  console.log(`Reason: ${result.reason}`);
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example usage with sample data
 * Uncomment and run to test
 */
export async function exampleUsage() {
  // Example: 1 depot + 6 stops in a city
  // Replace with real coordinates or addresses
  const exampleLocations: Location[] = [
    {
      label: 'Depot (Warehouse)',
      lat: 24.0528839,
      lng: -104.6048736,
      address: 'Calle Principal 123, Durango, México',
    },
    {
      label: 'Stop 1',
      lat: 24.0419888,
      lng: -104.6565493,
      address: 'Calle A, Durango',
    },
    {
      label: 'Stop 2',
      lat: 24.0620000,
      lng: -104.6100000,
      address: 'Calle B, Durango',
    },
    {
      label: 'Stop 3',
      lat: 24.0450000,
      lng: -104.6200000,
      address: 'Calle C, Durango',
    },
    {
      label: 'Stop 4',
      lat: 24.0550000,
      lng: -104.6500000,
      address: 'Calle D, Durango',
    },
    {
      label: 'Stop 5',
      lat: 24.0480000,
      lng: -104.6300000,
      address: 'Calle E, Durango',
    },
    {
      label: 'Stop 6',
      lat: 24.0600000,
      lng: -104.6400000,
      address: 'Calle F, Durango',
    },
  ];

  try {
    const result = await compareOneVsTwoDrivers(exampleLocations);
    printComparison(result, exampleLocations);
    return result;
  } catch (error) {
    console.error('Error in example usage:', error);
    throw error;
  }
}

