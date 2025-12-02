/**
 * Demo component for VRP Comparison
 * 
 * This component demonstrates how to use the VRP solver to compare
 * 1 driver vs 2 drivers for a set of locations.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Truck, Route, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  compareOneVsTwoDrivers,
  printComparison,
  formatRoute,
  type Location,
  type ComparisonResult,
} from '@/utils/vrpSolver';

const VRPComparisonDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([
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
  ]);

  const handleCompare = async () => {
    if (locations.length < 2) {
      setError('Need at least 1 depot + 1 stop');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const comparisonResult = await compareOneVsTwoDrivers(locations);
      setResult(comparisonResult);
      
      // Also print to console for detailed view
      printComparison(comparisonResult, locations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('VRP Comparison Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addStop = () => {
    setLocations([
      ...locations,
      {
        label: `Stop ${locations.length}`,
        lat: 24.0500000,
        lng: -104.6200000,
        address: '',
      },
    ]);
  };

  const removeStop = (index: number) => {
    if (index === 0) {
      setError('Cannot remove depot (first location)');
      return;
    }
    if (locations.length <= 2) {
      setError('Need at least 1 depot + 1 stop');
      return;
    }
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocation = (index: number, field: keyof Location, value: string | number) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            VRP Comparison: 1 Driver vs 2 Drivers
          </CardTitle>
          <CardDescription>
            Compare route optimization for 1 driver vs 2 drivers using Google Distance Matrix API.
            The recommendation is based on minimizing the maximum route time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Locations</Label>
              <Button onClick={addStop} size="sm" variant="outline">
                Add Stop
              </Button>
            </div>

            {locations.map((loc, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={loc.label || ''}
                      onChange={(e) => updateLocation(index, 'label', e.target.value)}
                      placeholder={index === 0 ? 'Depot' : `Stop ${index}`}
                    />
                  </div>
                  <div>
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="0.0000001"
                      value={loc.lat}
                      onChange={(e) => updateLocation(index, 'lat', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="0.0000001"
                      value={loc.lng}
                      onChange={(e) => updateLocation(index, 'lng', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    {index > 0 && (
                      <Button
                        onClick={() => removeStop(index)}
                        variant="destructive"
                        size="sm"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                {loc.address && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <p className="text-sm">{loc.address}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Compare Button */}
          <Button
            onClick={handleCompare}
            disabled={loading || locations.length < 2}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing Routes...
              </>
            ) : (
              <>
                <Route className="mr-2 h-4 w-4" />
                Compare 1 Driver vs 2 Drivers
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-6 mt-6">
              {/* Recommendation */}
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.recommendation === '1 driver' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                    Recommendation: {result.recommendation.toUpperCase()}
                  </CardTitle>
                  <CardDescription>{result.reason}</CardDescription>
                </CardHeader>
              </Card>

              {/* 1 Driver Solution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    1 Driver Solution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Total Distance</Label>
                      <p className="text-2xl font-bold">{result.oneDriver.totalDistance.toFixed(2)} km</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Time</Label>
                      <p className="text-2xl font-bold">{result.oneDriver.totalTime.toFixed(1)} min</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Max Route Time</Label>
                      <p className="text-xl font-semibold">{result.oneDriver.maxRouteTime.toFixed(1)} min</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Max Route Distance</Label>
                      <p className="text-xl font-semibold">{result.oneDriver.maxRouteDistance.toFixed(2)} km</p>
                    </div>
                  </div>
                  {result.oneDriver.routes.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <Label className="text-sm font-semibold">Route:</Label>
                      <pre className="text-sm mt-2 whitespace-pre-wrap">
                        {formatRoute(result.oneDriver.routes[0], locations, 1)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 2 Drivers Solution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    <Truck className="h-5 w-5" />
                    2 Drivers Solution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Total Distance</Label>
                      <p className="text-2xl font-bold">{result.twoDrivers.totalDistance.toFixed(2)} km</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Total Time</Label>
                      <p className="text-2xl font-bold">{result.twoDrivers.totalTime.toFixed(1)} min</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Max Route Time</Label>
                      <p className="text-xl font-semibold">{result.twoDrivers.maxRouteTime.toFixed(1)} min</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Max Route Distance</Label>
                      <p className="text-xl font-semibold">{result.twoDrivers.maxRouteDistance.toFixed(2)} km</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.twoDrivers.routes.map((route, idx) => {
                      if (route.stops.length <= 1) return null;
                      return (
                        <div key={idx} className="p-4 bg-muted rounded-lg">
                          <Label className="text-sm font-semibold">Route {idx + 1}:</Label>
                          <pre className="text-sm mt-2 whitespace-pre-wrap">
                            {formatRoute(route, locations, idx + 1)}
                          </pre>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VRPComparisonDemo;

