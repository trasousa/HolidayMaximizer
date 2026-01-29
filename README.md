# Holiday Maximizer

A smart vacation planning application that helps you optimize your PTO (Paid Time Off) by identifying the best days to take vacations around public holidays.

## Features

- **Smart Suggestions**: Automatically detects "bridges" and "extended weekends" where 1 or 2 days of PTO can result in long consecutive breaks.
- **Yearly Planning**: Seamlessly switch between years to plan ahead or look back at previous allocations.
- **Global Support**: Fetches public holidays for over 100 countries using the Nager.Date API.
- **Multi-Profile Management**: Create, edit, and delete profiles. Track and compare vacation plans for multiple people (e.g., you and your partner).
- **Commute Tracker**: Calculate hours saved by not commuting during your vacation.
- **Visual Previews**: Preview optimization suggestions directly on the calendar before accepting them.

## Tech Stack

- **React 19**: Frontend framework.
- **Tailwind CSS**: Styling.
- **Lucide React**: Icons.
- **Nager.Date API**: Public holiday data source.

## How to use

1.  **Create Profile**: Start by adding a person. Select the specific Year and Country for accurate holiday data.
2.  **Manage**: You can edit or delete profiles from the landing page at any time.
3.  **Optimize**: Enter the planning view. The app automatically suggests optimal date ranges. Click "View" to preview them on the calendar.
4.  **Plan**: Click dates on the calendar to book trips manually, or click "Apply" on a suggestion to book it instantly.
5.  **Navigate**: Use the year arrows in the header to switch contexts and see holidays for different years.