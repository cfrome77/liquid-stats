module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/* Minified JavaScript of <%= pkg.name %> version:<%= pkg.version %> */\n'
            },
            my_target: {
                files: {
                    'public/assets/js/checkins.min.js': ['public/assets/js/helpers.js', 'public/assets/js/checkins.js'],
					'public/assets/js/userinfo.min.js': ['public/assets/js/helpers.js', 'public/assets/js/userinfo.js'],
					'public/assets/js/badges.min.js': ['public/assets/js/helpers.js', 'public/assets/js/badges.js'],
					'public/assets/js/topbeers.min.js': ['public/assets/js/helpers.js', 'public/assets/js/toptbeers.js']
                }
            }
        },
        cssmin: {
            target: {
                files: {
                    'public/assets/css/style.min.css': ['public/assets/css/style.css']
                }
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('default', ['uglify', 'cssmin']);
}
