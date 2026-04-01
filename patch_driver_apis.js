const fs = require('fs');
const path = require('path');

const driverApiDir = path.join(__dirname, 'app', 'api', 'driver');
const subDirs = fs.readdirSync(driverApiDir).filter(f => fs.statSync(path.join(driverApiDir, f)).isDirectory());

const injectionStr = `
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (user?.role === 'PASSENGER') return NextResponse.json({ error: "Passengers cannot access driver endpoints." }, { status: 403 })
`;

for (const dir of subDirs) {
  const routePath = path.join(driverApiDir, dir, 'route.ts');
  if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf-8');
    
    // Check if already modified
    if (content.includes("user?.role === 'PASSENGER'")) {
      console.log(`Skipping ${dir} - already patched.`);
      continue;
    }
    
    // Find where to inject
    // We want to inject right after `if (!userId) return NextResponse.json({ error: "Unauthorized" }...`
    // Or `if (!userId) return new NextResponse("Unauthorized", { status: 401 })`
    
    const lines = content.split('\n');
    let injected = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('if (!userId)') && lines[i].includes('Unauthorized')) {
        lines.splice(i + 1, 0, injectionStr);
        injected = true;
        break;
      }
    }
    
    if (injected) {
      if (!content.includes('prisma')) {
        lines.unshift(`import { prisma } from "@/lib/prisma"`);
      }
      fs.writeFileSync(routePath, lines.join('\n'));
      console.log(`Patched ${dir}`);
    } else {
      console.log(`Failed to patch ${dir} - could not find injection point.`);
    }
  }
}
