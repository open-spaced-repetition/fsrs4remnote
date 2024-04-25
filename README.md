# Archived in 2024-04-25

This repository is archived and will be read-only, because FSRS has been integrated to RemNote 1.16 officially: [🎉 RemNote 1.16 – Ultimate Spaced Repetition! 🎉 | Changelog | RemNote](https://feedback.remnote.com/changelog/remnote-1-16-ultimate-spaced-repetition)

# FSRS4RemNote

FSRS4RemNote is a custom scheduler plugin for RemNote implementing the Free Spaced Repetition Scheduler. FSRS is based on the [DSR](https://supermemo.guru/wiki/Two_components_of_memory) (Difficulty, Stability, Retrievability) model proposed by [Piotr Wozniak](https://supermemo.guru/wiki/Piotr_Wozniak), the author of SuperMemo. FSRS is improved with the DHP (Difficulty, Half-life, Probability of recall) model introduced in the paper: [A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling](https://www.maimemo.com/paper/).

FSRS4RemNote consists of two main parts: scheduler and optimizer.

The scheduler is based on a variant of the DSR  model, which is used to predict memory states. The scheduler aims to achieve the requested retention for each card and each review.

The optimizer applies *Maximum Likelihood Estimation* and *Backpropagation Through Time* to estimate the stability of memory and learn the laws of memory from time-series review logs.

## Usage

- Install the plugin from the RemNote plugin marketplace.
- Open the settings page and click on [Custom Schedulers](https://www.youtube.com/watch?v=IwaoV-C9az8).
- You can choose to use FSRS4RemNote as your Global Default Scheduler or any other scheduler by clicking on the "Scheduler Type" dropdown menu and selecting "FSRS4RemNote".
- There are a number of scheduler parameters which you can modify if you wish.

## FAQ

### What does the 'Free' mean in the name?

- The algorithm (FSRS) supports reviewing in advance or delay. It's free for users to decide the time of review. And it will adapt to the user's memory.
- Meanwhile, spaced repetition is one essential technology to achieve free learning.
- FSRS runs entirely locally and has no risk under others' control.

### How does FSRS Calculate the next review date?

- The FSRS4Anki scheduler will calculate memory states based on your rating and the DSR model of memory (Difficulty, Stability, Retrievability). The scheduled date is based on memory states which get updated with each repetition and the custom parameters you set in the Custom Scheduler settings. 
- The DSR model uses thirteen parameters and six equations to describe memory dynamics during spaced repetition practice. For more details, see [Free Spaced Repetition Scheduler](https://github.com/open-spaced-repetition/fsrs4anki/wiki/Free-Spaced-Repetition-Scheduler).
- The model considers three variables that affect memory: difficulty, stability, and retrievability.
  - Difficulty refers to how hard it is to maintain a memory of something; the higher the difficulty, the harder it is to increase its stability and maintain it long term.
  - Stability refers to the storage strength of memory; the higher it is, the slower it is forgotten.
  - Retrievability refers to memory's retrieval strength; the lower it is, the higher the probability that the memory will be forgotten.
- In the model, the following memory laws are considered:
  - The more complex the memorized material, the lower the stability increase.
  - The higher the stability, the lower the stability increase (also known as [stabilization decay](https://supermemo.guru/wiki/Stabilization_decay))
  - The lower the retrievability, the higher the stability increase (also known as [stabilization curve](https://supermemo.guru/wiki/Stabilization_curve))

### What about cards with long repetition histories using a different scheduler? Do I have to start from scratch?

- No! The FSRS4RemNote scheduler will automatically convert other schedulers' repetition information to FSRS memory states.

### What happens if the plugin isn't running when I do my repetitions?

- RemNote will automatically fallback to either the Global Default Scheduler or the RemNote default scheduler algorithm.
