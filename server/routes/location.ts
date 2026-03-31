import express, { type Request, Response } from "express";
import { storage } from "../storage";

export function registerLocationRoutes(app: express.Application) {
  
  // Haversine formula to calculate distance between two points
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  function toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get nearby pharmacies sorted by distance
  app.get("/api/pharmacies/nearby", async (req: Request, res: Response) => {
    try {
      const { lat, lng, maxDistance } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ 
          message: "Parâmetros lat e lng são obrigatórios" 
        });
      }

      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);
      const maxDist = maxDistance ? parseFloat(maxDistance as string) : 50; // Default 50km

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.status(400).json({ 
          message: "Coordenadas inválidas" 
        });
      }

      // Get all active pharmacies
      const allPharmacies = await storage.getActivePharmacies();
      
      if (!allPharmacies || allPharmacies.length === 0) {
        return res.json({ pharmacies: [], userLocation: { lat: userLat, lng: userLng } });
      }

      // Calculate distance for each pharmacy and sort
      const pharmaciesWithDistance = allPharmacies
        .map(pharmacy => {
          const pharmacyLat = parseFloat(String(pharmacy.lat));
          const pharmacyLng = parseFloat(String(pharmacy.lng));
          
          // Skip pharmacies without valid coordinates
          if (isNaN(pharmacyLat) || isNaN(pharmacyLng)) {
            return null;
          }

          const distance = calculateDistance(userLat, userLng, pharmacyLat, pharmacyLng);
          
          return {
            ...pharmacy,
            distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
            distanceText: formatDistance(distance),
            coordinates: {
              lat: pharmacyLat,
              lng: pharmacyLng
            }
          };
        })
        .filter(p => p !== null && p.distance <= maxDist)
        .sort((a, b) => a!.distance - b!.distance);

      res.json({
        pharmacies: pharmaciesWithDistance,
        userLocation: { lat: userLat, lng: userLng },
        totalFound: pharmaciesWithDistance.length
      });
    } catch (error) {
      console.error("Error fetching nearby pharmacies:", error);
      res.status(500).json({ message: "Erro ao buscar farmácias próximas" });
    }
  });

  // Get all pharmacies sorted by distance from a point (optional)
  app.get("/api/pharmacies/sorted", async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.query;
      
      const allPharmacies = await storage.getActivePharmacies();
      
      if (!lat || !lng) {
        // Return without sorting
        return res.json({ pharmacies: allPharmacies });
      }

      const userLat = parseFloat(lat as string);
      const userLng = parseFloat(lng as string);

      if (isNaN(userLat) || isNaN(userLng)) {
        return res.json({ pharmacies: allPharmacies });
      }

      const pharmaciesWithDistance = allPharmacies
        .map(pharmacy => {
          const pharmacyLat = parseFloat(String(pharmacy.lat));
          const pharmacyLng = parseFloat(String(pharmacy.lng));
          
          if (isNaN(pharmacyLat) || isNaN(pharmacyLng)) {
            return {
              ...pharmacy,
              distance: null,
              distanceText: null,
              coordinates: null
            };
          }

          const distance = calculateDistance(userLat, userLng, pharmacyLat, pharmacyLng);
          
          return {
            ...pharmacy,
            distance: Math.round(distance * 100) / 100,
            distanceText: formatDistance(distance),
            coordinates: {
              lat: pharmacyLat,
              lng: pharmacyLng
            }
          };
        })
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

      res.json({
        pharmacies: pharmaciesWithDistance,
        userLocation: { lat: userLat, lng: userLng }
      });
    } catch (error) {
      console.error("Error fetching sorted pharmacies:", error);
      res.status(500).json({ message: "Erro ao ordenar farmácias" });
    }
  });

  function formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }

  console.log("[Location] Location routes registered");
}
