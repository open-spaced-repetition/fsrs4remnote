# FSRS4RemNote

FSRS4RemNote is a custom scheduler plugin for RemNote implementing the Free Spaced Repetition Scheduler. FSRS4RemNote consists of two main parts: scheduler and optimizer.

The scheduler is based on a variant of the DSR (Difficulty, Stability, Retrievability) model, which is used to predict memory states. The scheduler aims to achieve the requested retention for each card and each review.

The optimizer applies *Maximum Likelihood Estimation* and *Backpropagation Through Time* to estimate the stability of memory and learn the laws of memory from time-series review logs.

For more detail on the mechanism of the FSRS algorithm, please see this paper: [A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling](https://www.maimemo.com/paper/).

## Usage

- Install the plugin from the RemNote plugin marketplace.
- Open the settings page and click on [Custom Schedulers](https://www.youtube.com/watch?v=IwaoV-C9az8).
- You can choose to use FSRS4RemNote as your Global Default Scheduler or any other scheduler by clicking on the "Scheduler Type" dropdown menu and selecting "FSRS4RemNote".
- There are a number of scheduler parameters which you can modify if you wish.

## FAQ

### How does FSRS Calculate the next review date?

- The FSRS4Anki scheduler will calculate memory states based on your rating and the DSR model of memory (Difficulty, Stability, Retrievability). The scheduled date is based on memory states which get updated with each repetition and the custom parameters you set in the Custom Scheduler settings. The DSR model uses thirteen parameters and six equations to describe memory dynamics during spaced repetition practice. For more details, see [Free Spaced Repetition Scheduler](https://github.com/open-spaced-repetition/fsrs4anki/wiki/Free-Spaced-Repetition-Scheduler).

### What about cards with long repetition histories using a different scheduler? Do I have to start from scratch?

- No! The FSRS4RemNote scheduler will automatically convert other schedulers' repetition information to FSRS memory states.

### What happens if the plugin isn't running when I do my repetitions?

- RemNote will automatically fallback to either the Global Default Scheduler or the RemNote default scheduler algorithm.
