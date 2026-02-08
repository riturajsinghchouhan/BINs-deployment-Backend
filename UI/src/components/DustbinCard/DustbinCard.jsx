import { MapPin, Trash2, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import './DustbinCard.css';

export default function DustbinCard({
    bin,
    onClaim,
    onComplete,
    onDelete,
    showActions,
    isWorker,
    currentUserId
}) {
    const getStatusClass = (status) => {
        switch (status) {
            case 'empty':
                return 'badge-green';
            case 'half-full':
                return 'badge-yellow';
            case 'full':
                return 'badge-red';
            case 'being-emptied':
                return 'badge-blue';
            default:
                return 'badge-gray';
        }
    };

    const getFillLevelClass = (level) => {
        if (level >= 80) return 'fill-red';
        if (level >= 50) return 'fill-yellow';
        return 'fill-green';
    };

    const getIconClass = (level) => {
        if (level >= 80) return 'icon-red';
        if (level >= 50) return 'icon-yellow';
        return 'icon-green';
    };

    const getIconWrapperClass = (level) => {
        if (level >= 80) return 'wrapper-red';
        if (level >= 50) return 'wrapper-yellow';
        return 'wrapper-green';
    };

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${bin.latitude},${bin.longitude}`;

    const canClaim = isWorker && bin.status !== 'being-emptied' && bin.status !== 'empty';
    const canComplete = isWorker && bin.assignedWorkerId === currentUserId && bin.status === 'being-emptied';

    return (
        <div className="dustbin-card">
            <div className="dustbin-card-content">
                <div className="dustbin-header">
                    <div className="dustbin-header-left">
                        <div className={`dustbin-icon-wrapper ${getIconWrapperClass(bin.fillLevel)}`}>
                            <Trash2 className={`dustbin-icon ${getIconClass(bin.fillLevel)}`} />
                        </div>
                        <div>
                            <h3 className="dustbin-title">{bin.binNumber}</h3>
                            <p className="dustbin-location">{bin.location}</p>
                        </div>
                    </div>
                    <span className={`dustbin-badge ${getStatusClass(bin.status)}`}>
                        {bin.status.replace('-', ' ')}
                    </span>
                </div>

                <div className="dustbin-info-section">
                    <div className="dustbin-fill-row">
                        <span className="dustbin-label">Fill Level</span>
                        <span className="dustbin-value">{bin.fillLevel}%</span>
                    </div>
                    <div className="dustbin-progress-bg">
                        <div
                            className={`dustbin-progress-fill ${getFillLevelClass(bin.fillLevel)}`}
                            style={{ width: `${bin.fillLevel}%` }}
                        />
                    </div>

                    {bin.lastEmptied && (
                        <div className="dustbin-meta-row">
                            <Clock className="w-4 h-4" />
                            <span>Last emptied: {format(new Date(bin.lastEmptied), 'MMM d, h:mm a')}</span>
                        </div>
                    )}

                    <div className="dustbin-location-row">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-600">
                            {bin.latitude.toFixed(4)}, {bin.longitude.toFixed(4)}
                        </span>
                    </div>
                </div>

                <div className="dustbin-actions">
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dustbin-action-link"
                    >
                        <button className="dustbin-btn dustbin-btn-outline">
                            <MapPin className="w-4 h-4 mr-2" />
                            View on Google Maps
                            <ExternalLink className="w-3 h-3 ml-2" />
                        </button>
                    </a>

                    {showActions && isWorker && canClaim && onClaim && (
                        <button
                            onClick={() => onClaim(bin._id)}
                            className="dustbin-btn dustbin-btn-primary"
                        >
                            Claim This Bin
                        </button>
                    )}

                    {showActions && isWorker && canComplete && onComplete && (
                        <button
                            onClick={() => onComplete(bin._id)}
                            className="dustbin-btn dustbin-btn-green"
                        >
                            Mark as Emptied
                        </button>
                    )}

                    {showActions && !isWorker && onDelete && (
                        <button
                            onClick={() => onDelete(bin._id)}
                            className="dustbin-btn dustbin-btn-destructive"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Bin
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
