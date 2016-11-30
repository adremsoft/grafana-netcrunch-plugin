module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks("gruntify-eslint");

  var productionDest = 'dist',
      developmentDest = '../Projects/Go/src/github.com/grafana/grafana/data/plugins/grafana-netcrunch/';

  function createCleanTask(destination) {
    return [destination];
  }

  function createCopyTask(destination) {
    var excludeFiles = ['!**/*.js', '!**/*.ts', '!**/*.scss', '!license-banner.txt'];
    return {
      files: [
        {
          cwd: 'src',
          expand: true,
          src: ['**/*'].concat(excludeFiles),
          dest: destination
        },
        {
          cwd: 'src/datasource/services/netCrunchAPI/adrem',
          expand: true,
          src: ['*.min.js'],
          dest: destination + '/datasource/services/netCrunchAPI/adrem'
        },
        {
          expand: true,
          src: ['README.md'],
          dest: destination
        }
      ]
    }
  }

  function createBabelTask(destination) {
    return {
      files: [{
        cwd: 'src',
        expand: true,
        src: ['**/*.js', '**/*.ts', '!**/*.min.js'],
        dest: destination,
        ext: '.js',
        extDot: 'last'
      }]
    }
  }

  grunt.initConfig({

    clean: {
      options: { force: true },
      prod: createCleanTask(productionDest),
      dev: createCleanTask(developmentDest)
    },

    copy: {
      prod: createCopyTask(productionDest),
      dev: createCopyTask(developmentDest)
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'README.md'],
        tasks: ['develop'],
        options: { spawn: false }
      }
    },

    eslint: {
      options: {
        silent: true
      },
      src: ['src/**/*.js', '!**/*.min.js']
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015'],
        plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of']
      },
      prod: createBabelTask(productionDest),
      dev: createBabelTask(developmentDest)
    }
  });

  grunt.registerTask('default', ['clean:prod', 'copy:prod', 'eslint', 'babel:prod']);
  grunt.registerTask('build', ['default']);
  grunt.registerTask('develop', ['clean:dev', 'copy:dev', 'eslint', 'babel:dev']);

};
