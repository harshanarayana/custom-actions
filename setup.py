import codecs
import os
import sys

from distutils.util import strtobool

from setuptools import setup, find_packages
from setuptools.command.test import test as TestCommand


class PyTest(TestCommand):
    """
    Provide a Test runner to be used from setup.py to run unit tests
    """

    user_options = [("pytest-args=", "a", "Arguments to pass to pytest")]

    def initialize_options(self):
        TestCommand.initialize_options(self)
        self.pytest_args = ""

    def run_tests(self):
        import shlex

        import pytest

        errno = pytest.main(shlex.split(self.pytest_args))
        sys.exit(errno)


def open_local(paths, mode="r", encoding="utf8"):
    path = os.path.join(os.path.abspath(os.path.dirname(__file__)), *paths)

    return codecs.open(path, mode, encoding)


with open_local(["README.md"]) as rm:
    long_description = rm.read()


setup_kwargs = {
    "name": "custom-actions",
    "version": "0.0.1",
    "url": "http://github.com/harshanarayana/custom-actions",
    "license": "MIT",
    "author": "Harsha Narayan",
    "author_email": "harsha2k4@gmail.com",
    "description": (
        "Sample Package to test things"
    ),
    "long_description": long_description,
    "packages": find_packages(),
    "platforms": "any",
    "python_requires": ">=3.7",
    "long_description_content_type": 'text/markdown',
    "classifiers": [
        "Development Status :: 4 - Beta",
        "Environment :: Web Environment",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
    ],
}

env_dependency = (
    '; sys_platform != "win32" ' 'and implementation_name == "cpython"'
)
ujson = "ujson>=1.35" + env_dependency
uvloop = "uvloop>=0.5.3" + env_dependency

requirements = [
    "sanic",
]

tests_require = [
    "pytest==5.2.1",
    "multidict>=5.0,<6.0",
    "gunicorn==20.0.4",
    "pytest-cov",
    "beautifulsoup4",
    uvloop,
    ujson,
    "pytest-sanic",
    "pytest-sugar",
    "pytest-benchmark",
]

docs_require = [
    "sphinx>=2.1.2",
    "sphinx_rtd_theme",
    "recommonmark>=0.5.0",
    "docutils",
    "pygments",
]

dev_require = tests_require + [
    "aiofiles",
    "tox",
    "black",
    "flake8",
    "bandit",
    "towncrier",
]

all_require = dev_require + docs_require

if strtobool(os.environ.get("SANIC_NO_UJSON", "no")):
    print("Installing without uJSON")
    tests_require.remove(ujson)

# 'nt' means windows OS
if strtobool(os.environ.get("SANIC_NO_UVLOOP", "no")):
    print("Installing without uvLoop")
    tests_require.remove(uvloop)

extras_require = {
    "test": tests_require,
    "dev": dev_require,
    "docs": docs_require,
    "all": all_require,
}

setup_kwargs["install_requires"] = requirements
setup_kwargs["tests_require"] = tests_require
setup_kwargs["extras_require"] = extras_require
setup_kwargs["cmdclass"] = {"test": PyTest}
setup(**setup_kwargs)