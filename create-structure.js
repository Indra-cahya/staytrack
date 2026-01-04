// create-structure.js
const fs = require('fs');
const path = require('path');

const projectStructure = {
  'staytrack': {
    'public': {
      'css': ['style.css', 'dashboard.css', 'auth.css'],
      'js': ['auth.js', 'dashboard.js', 'utils.js'],
      'images': ['logo.png', 'favicon.ico'],
      'uploads': []
    },
    'src': {
      'models': [
        'User.js', 'Owner.js', 'Admin.js', 'Tenant.js', 
        'Room.js', 'Bill.js', 'Payment.js', 'index.js'
      ],
      'controllers': [
        'authController.js', 'adminController.js', 'roomController.js',
        'tenantController.js', 'billController.js'
      ],
      'routes': [
        'authRoutes.js', 'adminRoutes.js', 'roomRoutes.js',
        'tenantRoutes.js', 'billRoutes.js'
      ],
      'middleware': ['auth.js', 'roleCheck.js', 'upload.js'],
      'config': ['database.js', 'upload.js'],
      'utils': ['helpers.js', 'validators.js'],
      'app.js': ''
    },
    'views': {
      'auth': ['login.html', 'register.html'],
      'dashboard': {
        'owner': ['dashboard.html', 'rooms.html', 'tenants.html', 'bills.html'],
        'admin': ['dashboard.html', 'rooms.html', 'tenants.html'],
        'tenant': ['dashboard.html', 'bills.html', 'profile.html']
      },
      'partials': ['header.html', 'sidebar.html', 'footer.html']
    },
    'package.json': '',
    'server.js': '',
    'README.md': ''
  }
};

function createStructure(basePath, structure) {
  for (const [name, content] of Object.entries(structure)) {
    const currentPath = path.join(basePath, name);
    
    if (typeof content === 'object' && !Array.isArray(content)) {
      // Ini adalah folder
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
        console.log(`📁 Created folder: ${currentPath}`);
      }
      
      // Rekursif untuk subfolder
      createStructure(currentPath, content);
    } else if (Array.isArray(content)) {
      // Ini adalah folder dengan file-file
      if (!fs.existsSync(currentPath)) {
        fs.mkdirSync(currentPath, { recursive: true });
        console.log(`📁 Created folder: ${currentPath}`);
      }
      
      // Buat file-file dalam folder
      content.forEach(file => {
        const filePath = path.join(currentPath, file);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '');
          console.log(`📄 Created file: ${filePath}`);
        }
      });
    } else {
      // Ini adalah file
      if (!fs.existsSync(currentPath)) {
        fs.writeFileSync(currentPath, '');
        console.log(`📄 Created file: ${currentPath}`);
      }
    }
  }
}

// Eksekusi
const baseDir = process.cwd();
console.log('Creating StayTrack project structure...\n');
createStructure(baseDir, projectStructure);
console.log('\n Project structure created successfully!');