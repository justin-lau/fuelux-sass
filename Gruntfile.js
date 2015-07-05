/*jshint expr:true*/
/*global module:false, process:false*/
module.exports = function (grunt) {
	'use strict';

	// use --no-livereload to disable livereload. Helpful to 'serve' multiple projects
	var isLivereloadEnabled = (typeof grunt.option('livereload') !== 'undefined') ? grunt.option('livereload') : true;

	var semver = require('semver');
	var currentVersion = require('./package.json').version;

	// Project configuration.
	grunt.initConfig({
		// Metadata
		bannerRelease: '/*!\n' +
		' * Fuel UX Unofficial Sass Port v<%= pkg.version %> \n' +
		' * Copyright 2012-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
		' * Licensed under the <%= pkg.license.type %> license (<%= pkg.license.url %>)\n' +
		' */\n',
		banner: '/*!\n' +
		' * Fuel UX Unofficial Sass Port EDGE - Built <%= grunt.template.today("yyyy/mm/dd, h:MM:ss TT") %> \n' +
		' * Previous release: v<%= pkg.version %> \n' +
		' * Copyright 2012-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
		' * Licensed under the <%= pkg.license.type %> license (<%= pkg.license.url %>)\n' +
		' */\n',
		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: ['pkg'],
				commit: false,
				createTag: false,
				tagName: '%VERSION%',
				tagMessage: '%VERSION%',
				push: false,
				gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
			}
		},
		jqueryCheck: 'if (typeof jQuery === \'undefined\') { throw new Error(\'Fuel UX\\\'s JavaScript requires jQuery\') }\n\n',
		bootstrapCheck: 'if (typeof jQuery.fn.dropdown === \'undefined\' || typeof jQuery.fn.collapse === \'undefined\') ' +
		'{ throw new Error(\'Fuel UX\\\'s JavaScript requires Bootstrap\') }\n\n',
		pkg: grunt.file.readJSON('package.json'),
		// Try ENV variables (export SAUCE_ACCESS_KEY=XXXX), if key doesn't exist, try key file
		sauceLoginFile: grunt.file.exists('SAUCE_API_KEY.yml') ? grunt.file.readYAML('SAUCE_API_KEY.yml') : undefined,
		sauceUser: process.env.SAUCE_USERNAME || 'fuelux',
		sauceKey: process.env.SAUCE_ACCESS_KEY ? process.env.SAUCE_ACCESS_KEY : '<%= sauceLoginFile.key %>',
		// TEST URLS
		allTestUrls: ['2.1.0', '1.11.0', '1.9.1', 'browserGlobals', 'noMoment', 'codeCoverage' ].map(function (type) {
			if (type === 'browserGlobals') {
				return 'http://localhost:<%= connect.testServer.options.port %>/test/browser-globals.html';
			}
			else if (type === 'codeCoverage') {
				return 'http://localhost:<%= connect.testServer.options.port %>/test/?coverage=true';
			}
			else if (type === 'noMoment') {
				return 'http://localhost:<%= connect.testServer.options.port %>/test/?no-moment=true';
			}
			else {
				// test dist with multiple jQuery versions
				return 'http://localhost:<%= connect.testServer.options.port %>/test/?testdist=true';
			}
		}),

		//Tasks configuration
		blanket_qunit: {
			source: {
				options: {
					urls: ['http://localhost:<%= connect.testServer.options.port %>/test/?coverage=true&gruntReport'],
					threshold: 1,
					globalThreshold: 1
				}
			}
		},
		clean: {
			dist: ['dist'],
			zipsrc: ['dist/fuelux'],// temp folder
			screenshots: ['page-at-timeout-*.jpg']
		},
		compress: {
			zip: {
				files: [
					{
						cwd: 'dist/',
						expand: true,
						src: ['fuelux/**']
					}
				],
				options: {
					archive: 'dist/fuelux.zip',
					mode: 'zip'
				}
			}
		},
		concat: {
			dist: {
				files: {
					// manually concatenate JS files (due to dependency management)
					'dist/js/fuelux.js': [
						'js/checkbox.js',
						'js/combobox.js',
						'js/datepicker.js',
						'js/dropdown-autoflip.js',
						'js/loader.js',
						'js/placard.js',
						'js/radio.js',
						'js/search.js',
						'js/selectlist.js',
						'js/spinbox.js',
						'js/tree.js',
						'js/wizard.js',

						//items with dependencies on other controls
						'js/infinite-scroll.js',
						'js/pillbox.js',
						'js/repeater.js',
						'js/repeater-list.js',
						'js/repeater-thumbnail.js',
						'js/scheduler.js'
					]
				},
				options: {
					banner: '<%= banner %>' + '\n\n' +
					'// For more information on UMD visit: https://github.com/umdjs/umd/' + '\n' +
					'(function (factory) {' + '\n' +
					'\tif (typeof define === \'function\' && define.amd) {' + '\n' +
					'\t\tdefine([\'jquery\', \'bootstrap\'], factory);' + '\n' +
					'\t} else {' + '\n' +
					'\t\tfactory(jQuery);' + '\n' +
					'\t}' + '\n' +
					'}(function (jQuery) {\n\n' +
					'<%= jqueryCheck %>' +
					'<%= bootstrapCheck %>',
					footer: '\n}));',
					process: function (source) {
						source = '(function ($) {\n\n' +
							source.replace(/\/\/ -- BEGIN UMD WRAPPER PREFACE --(\n|.)*\/\/ -- END UMD WRAPPER PREFACE --/g, '');
						source = source.replace(/\/\/ -- BEGIN UMD WRAPPER AFTERWORD --(\n|.)*\/\/ -- END UMD WRAPPER AFTERWORD --/g, '') + '\n})(jQuery);\n\n';
						return source;
					}
				}
			}
		},
		connect: {
			server: {
				options: {
					hostname: '*',
					base: {
						path: '.',
						options: {
							index: ['index.html', 'tests.html'],
						}
					},
					port: process.env.PORT || 8000,
					useAvailablePort: true // increment port number, if unavailable...
				}
			},
			testServer: {
				options: {
					base: {
						path: '.',
						options: {
							index: ['index.html', 'tests.html'],
						}
					},
					hostname: '*',
					port: 9000, // allows main server to be run simultaneously
					useAvailablePort: true// increment port number, if unavailable...
				}
			}
		},
		copy: {
			fonts: {
				cwd: 'assets/fonts/',
				dest: 'dist/fonts/',
				expand: true,
				filter: 'isFile',
				src: ['*']
			},
			javascripts: {
				cwd: 'assets/javascripts/',
				dest: 'dist/js/',
				expand: true,
				src: ['*']
			}
		},
		jsbeautifier: {
			files: ['dist/js/fuelux.js'],
			options: {
				js: {
					braceStyle: 'collapse',
					breakChainedMethods: false,
					e4x: false,
					evalCode: false,
					indentLevel: 0,
					indentSize: 4,
					indentWithTabs: true,
					jslintHappy: false,
					keepArrayIndentation: false,
					keepFunctionIndentation: false,
					maxPreserveNewlines: 10,
					preserveNewlines: true,
					spaceBeforeConditional: true,
					spaceInParen: true,
					unescapeStrings: false,
					wrapLineLength: 0
				}
			}
		},
		jshint: {
			options: {
				boss: true,
				browser: true,
				curly: false,
				eqeqeq: true,
				eqnull: true,
				globals: {
					jQuery: true,
					define: true,
					require: true
				},
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				unused: false// changed
			},
			sourceAndDist: ['Gruntfile.js', 'js/*.js', 'dist/fuelux.js'],
			tests: {
				options: {
					latedef: false,
					undef: false,
					unused: false
				},
				files: {
					src: ['test/**/*.js']
				}
			}
		},
		sass: {
			dev: {
				options: {
					sourceMap: true,
					sourceMapContents: true,
				},
				files: {
					'dist/css/fuelux-dev.css': 'assets/stylesheets/fuelux.scss'
				}
			},
			dist: {
				options: {
					sourceMap: true,
					sourceMapContents: true,
				},
				files: {
					'dist/css/fuelux.css': 'assets/stylesheets/fuelux.scss'
				}
			}
		},
		cssmin: {
			target: {
				files: [{
					expand: true,
					cwd: 'dist/css',
					src: ['*.css', '!*.min.css'],
					dest: 'dist/css',
					ext: '.min.css'
				}]
			}
		},
		prompt: {
			bump: {
				options: {
					questions: [
						{
							config: 'bump.increment',
							type: 'list',
							message: 'Bump version from ' + '<%= pkg.version %>' + ' to:',
							choices: [
								// {
								// 	value: 'build',
								// 	name:  'Build:  '+ (currentVersion + '-?') + ' Unstable, betas, and release candidates.'
								// },
								{
									value: 'patch',
									name: 'Patch:  ' + semver.inc(currentVersion, 'patch') + ' Backwards-compatible bug fixes.'
								},
								{
									value: 'minor',
									name: 'Minor:  ' + semver.inc(currentVersion, 'minor') + ' Add functionality in a backwards-compatible manner.'
								},
								{
									value: 'major',
									name: 'Major:  ' + semver.inc(currentVersion, 'major') + ' Incompatible API changes.'
								},
								{
									value: 'custom',
									name: 'Custom: ?.?.? Specify version...'
								}
							]
						},
						{
							config: 'bump.version',
							type: 'input',
							message: 'What specific version would you like',
							when: function (answers) {
								return answers['bump.increment'] === 'custom';
							},
							validate: function (value) {
								var valid = semver.valid(value);
								return valid || 'Must be a valid semver, such as 1.2.3-rc1. See http://semver.org/ for more details.';
							}
						}
					]
				}
			}
		},
		replace: {
			readme: {
				src: ['DETAILS.md', 'README.md'],
				overwrite: true,// overwrite matched source files
				replacements: [{
					from: /fuelux\/\d\.\d\.\d/g,
					to: "fuelux/<%= pkg.version %>"
				}]
			}
		},
		uglify: {
			options: {
				report: 'min'
			},
			fuelux: {
				options: {
					banner: '<%= banner %>'
				},
				src: 'dist/js/fuelux.js',
				dest: 'dist/js/fuelux.min.js'
			}
		},
		usebanner: {
			dist: {
				options: {
					position: 'top',
					banner: '<%= banner %>'
				},
				files: {
					src: [
						'dist/css/fuelux.css',
						'dist/css/fuelux.min.css'
					]
				}
			}
		},
		validation: {
			// if many errors are found, this may log to console while other tasks are running
			options: {
				reset: function () {
					grunt.option('reset') || false ;
				},
				stoponerror: true,
				relaxerror: [//ignores these errors
					'Section lacks heading. Consider using h2-h6 elements to add identifying headings to all sections.',
					'Bad value X-UA-Compatible for attribute http-equiv on element meta.',
					'Element head is missing a required instance of child element title.'
				],
				doctype: 'HTML5',
				reportpath: false
			},
			files: {
				src: ['index.html', 'test/markup/*.html']
			}
		},
		watch: {
			//watch everything and test everything (test dist)
			full: {
				files: ['Gruntfile.js', 'assets/assets/fonts/**', 'assets/javascripts/**', 'assets/stylesheets/**', 'index.html', 'dev.html'],
				options: {
					livereload: isLivereloadEnabled
				},
				tasks: ['jshint', 'dist', 'validation']
			},
			//watch everything but only perform source qunit tests (don't test dist)
			source: {
				files: ['Gruntfile.js', 'assets/fonts/**', 'assets/javascripts/**', 'assets/stylesheets/**', 'index.html', 'dev.html'],
				options: {
					livereload: isLivereloadEnabled
				},
				tasks: ['jshint', 'connect:testServer', 'validation']
			},
			//only watch and dist sass, useful when doing SASS/CSS work
			sass: {
				files: ['assets/fonts/**', 'assets/stylesheets/**'],
				options: {
					livereload: isLivereloadEnabled
				},
				tasks: ['distcss']
			},
			cssdev: {
				files: ['Gruntfile.js', 'assets/stylesheets/**', 'index.html', 'index-dev.html', 'dev.html'],
				options: {
					livereload: isLivereloadEnabled
				},
				tasks: ['distcssdev']
			},
			//watch things that need compiled, useful for debugging/developing against dist
			dist: {
				files: ['assets/fonts/**', 'assets/javascripts/**', 'assets/stylesheets/**'],
				options: {
					livereload: isLivereloadEnabled
				},
				tasks: ['dist']
			},
			//just keep the server running, best for when you are just in the zone slinging code and don't want to be interrupted with tests
			lite: {
				files: [],
				options: {
					livereload: isLivereloadEnabled
				},
				tasks: []
			}
		}
	});

	// Look ma! Load all grunt plugins in one line from package.json
	require('load-grunt-tasks')(grunt, {
		scope: 'devDependencies'
	});


	/* -------------
		BUILD
	------------- */
	// CSS distribution task
	grunt.registerTask('distcss', 'Compile SASS into CSS', ['sass:dist', 'cssmin', 'usebanner']);

	// CSS distribution task (dev)
	grunt.registerTask('distcssdev', 'Compile SASS into the dev CSS', ['sass:dev']);

	// Full distribution task
	grunt.registerTask('dist', 'Build "dist." Contributors: do not commit "dist."', ['clean:dist', 'distcss', 'copy:fonts', 'copy:javascripts']);

	/* -------------
		SERVE
	------------- */
	// default serve task that runs tests and builds and tests dist by default.
	grunt.registerTask('serve', 'Test, build, serve files. (~20s)', function () {
		var tasks = ['servedist'];
		grunt.task.run(tasks);
	});

	// serve task that runs tests and builds and tests dist by default (~20s).
	grunt.registerTask('serveslow', 'Serve files. Run all tests. Does not build. (~20s)', function () {
		var tasks = ['connect:server', 'watch:source'];
		grunt.task.run(tasks);
	});

	//Fastest serve command for freely slinging code (no tests will run by default).
	grunt.registerTask('servefast', 'Serve the files (no watch), --test to run minimal tests. (~0s)', function () {
		grunt.task.run(['connect:server']);

		if (grunt.option('test')) {
			grunt.task.run(['connect:testServer', 'watch:source']);
		} else {
			grunt.task.run(['watch:lite']);
		}
	});

	// Fastest serve command when you're working on SASS
	grunt.registerTask('servesass', 'Compile SASS and serve the files. (~3s)', function () {
		grunt.task.run(['distcss']);

		grunt.task.run(['connect:server', 'watch:sass']);
	});

	// Complies the sass files into the -dev versions, does not overwrite the main css files.
	grunt.registerTask('servedev', 'Serve the files with no "dist" build or tests. Optional --no-sass to also disable compiling sass into css.', function() {
		if (! grunt.option('no-sass') ) {
			grunt.task.run(['distcssdev']);
		}
		grunt.task.run(['connect:server', 'watch:cssdev']);
	});

	// same as `grunt serve` but tests default to being off
	grunt.registerTask('servedist', 'Compile and serve everything. (~7s)', function () {
		grunt.task.run(['dist']);

		//start up the servers here so we can run tests if appropriate
		grunt.task.run(['connect:server']);
		grunt.task.run(['connect:testServer']);
		grunt.task.run(['watch:dist']);
	});
};
