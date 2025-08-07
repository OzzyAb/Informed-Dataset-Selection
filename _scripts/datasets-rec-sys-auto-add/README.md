# Datasets RecSys Auto Add

This script is used to add new performance results and update the pre-computed PCA results in the database. The script also automatically adds new algorithms and datasets along with their metadata if the algorithms and datasets in the added performance results do not already exist in the database.

## How To Use
In order to use the script, the Admin APIs must be activated on Kasserver first. To do that, you need to go to the `secrets.php` file under the `config` folder on FPT server on Kassserver. In this file, you need to give an admin header key as well as an admin secret key. Afterwards, the related variables in the script (`ADMIN_HEADER` and `ADMIN_SECRET_KEY`) must be set.

---
> Adding New Performance Results along with New Algorithms and New Datasets

- Make sure the new performance results in a csv file whose structure the same as the one with the `merged.csv` file. (The `merged.csv` file is an example. You can put your own csv file near the script.)
- Change the line of the code where the csv file is loaded
```python
df = pd.read_csv('merged.csv') # give your csv file (only new results!)
```
- In the main function, make sure you uncomment the following functions. (Updating the PCA results while adding the new performance results is a must. Otherwise, the difficulty of the new datasets will not be calculated.)
```python
addPerformanceResults()
updatePca()
```
---
> Updating PCA Results

In case you are missing some data related to the PCA results, you can only update the PCA results in the script. To do that, you need comment the function adding new performance results and uncomment the function updating the PCA results.
```python
#addPerformanceResults()
updatePca()
```

## Important Note
After using the Admin API endpoints, in order to increase the security, it is recommended to set the admin secret key to `null` in the `secrets.php` file. This disables all Admin API endpoints in the backend.
