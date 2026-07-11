CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "version" TEXT,
  "plate" TEXT,
  "year" INTEGER,
  "fuelType" TEXT NOT NULL DEFAULT 'BENZINA',
  "purchaseDate" DATETIME,
  "purchasePriceCents" INTEGER,
  "initialMileageKm" INTEGER NOT NULL DEFAULT 0,
  "currentMileageKm" INTEGER NOT NULL DEFAULT 0,
  "tankCapacityLiters" REAL,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "ExpenseCategory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "color" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isFuel" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE "Refuel" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "odometerKm" INTEGER NOT NULL,
  "litersMl" INTEGER NOT NULL,
  "totalCents" INTEGER NOT NULL,
  "pricePerLiterMilliCents" INTEGER NOT NULL,
  "fuelType" TEXT NOT NULL DEFAULT 'BENZINA',
  "station" TEXT,
  "location" TEXT,
  "fullTank" BOOLEAN NOT NULL DEFAULT true,
  "paymentMethod" TEXT NOT NULL DEFAULT 'CARTA',
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Refuel_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Expense" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "description" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "paymentMethod" TEXT NOT NULL DEFAULT 'CARTA',
  "odometerKm" INTEGER,
  "supplier" TEXT,
  "notes" TEXT,
  "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON UPDATE CASCADE
);
CREATE TABLE "Maintenance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "odometerKm" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "workshop" TEXT,
  "costCents" INTEGER NOT NULL DEFAULT 0,
  "replacedParts" TEXT,
  "nextDueDate" DATETIME,
  "nextDueMileageKm" INTEGER,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Maintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "MileageRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "odometerKm" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "MileageRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "Reminder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "dueDate" DATETIME NOT NULL,
  "dueMileageKm" INTEGER,
  "periodicity" TEXT NOT NULL DEFAULT 'NESSUNA',
  "expectedCents" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'FUTURA',
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Reminder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
