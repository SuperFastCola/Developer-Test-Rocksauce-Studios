module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        uglify: {
            options: {
                mangle: false
            },
            my_target: {
                files: {
                    'www/js/redditApp.min.js': ["www/js/src/redditApp.js"]
                }
            }
        },
        sass: {
            options: {
                sourcemap: 'none',
                trace: true,
                style: 'nested'
            },
            compile: {
                files: {
                  'www/css/styles.css': 'www/css/styles.sass',
                }
            }
        },
        concat: {
            options: {
              separator: ';',
            },
            dist: {
              src: ['www/js/src/jquery-1.11.3.min.js', 'www/js/src/TweenLite.min.js','www/js/src/CSSPlugin.min.js','www/js/src/Draggable.min.js'],
              dest: 'www/js/lib/externals.js',
            },
        },
        watch: {
            css: {
                files: ['www/css/styles.sass'],
                tasks: ['sass']
            },
            scripts: {
                files: 'www/js/src/redditApp.js',
                tasks: ['uglify']
            }
        }

    });

    // Load required modules
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    // Default task(s).
    grunt.registerTask('default', ['uglify','sass','concat','watch']);
};