import { birthdayData } from '../data/birthdayData'

export function EventDetails() {
  const details = [
    ['Date', birthdayData.eventDate],
    ['Time', birthdayData.eventTime],
    ['Venue', birthdayData.venue],
    ['Dress Code', birthdayData.dressCode],
  ]

  return (
    <section className="details-section" aria-labelledby="details-title">
      <div className="section-heading stacked-heading">
        <p className="eyebrow">Party Quest</p>
        <h2 id="details-title">Event Details</h2>
      </div>
      <dl className="event-grid" aria-label="Event details">
        {details.map(([label, value]) => (
          <div className="event-detail" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
